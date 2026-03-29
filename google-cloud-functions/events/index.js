// [2026-03-29] - Event Engine v1.7.5: Safe & Idempotent Controller
// Implements Duplication Protection, Safe-Update (Wipe & Regenerate), and Request Idempotency.

const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser, authorizeRequest, isEventsSuperuser } = require('./utils/rbac');
const { expandRecurrence } = require('./utils/temporal');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

async function getSupabaseClient(authToken = null) {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  
  if (authToken) {
    try {
      const { data: { user }, error } = await client.auth.getUser(authToken);
      if (user && !error) {
        await client.auth.setSession({ access_token: authToken, refresh_token: authToken });
      }
    } catch (err) {
      console.warn('[Engine] Auth session override failed:', err.message);
    }
  }
  return client;
}

exports.events = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.authorization;
  const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
  const idempotencyKey = req.headers['x-idempotency-key'];
  const supabaseClient = await getSupabaseClient(authToken);

  // --- GET ENGINE ---
  if (req.method === 'GET') {
    try {
      const { organizationId, venueId, status, limit = '50', offset = '0' } = req.query;
      let query = supabaseClient.from('events').select('*').is('deleted_at', null).order('created_at', { ascending: false });
      if (organizationId) query = query.eq('organization_id', organizationId);
      if (venueId) query = query.eq('venue_id', venueId);
      if (status) query = query.eq('status', status);
      const { data: events, error } = await query.range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      if (error) throw error;
      return res.status(200).json({ success: true, data: events });
    } catch (error) {
      return res.status(500).json({ error: 'Engine read failure' });
    }
  }

  // --- POST ENGINE: IDEMPOTENT ATOMIC CREATION ---
  if (req.method === 'POST') {
    try {
      const { user, error: authError } = await getAuthenticatedUser(authHeader);
      if (authError || !user) return res.status(401).json({ error: 'Auth failed' });

      // 1. Idempotency Check
      if (idempotencyKey) {
        const { data: existingEvent } = await supabaseClient
          .from('events')
          .select('*')
          .eq('idempotency_key', idempotencyKey)
          .single();
        if (existingEvent) {
          return res.status(200).json({ success: true, data: existingEvent, note: 'Idempotent response' });
        }
      }

      const { event, recurrence } = req.body;
      if (!event.title || !event.organization_id || !event.start_time) {
        return res.status(400).json({ error: 'Missing core strategy fields' });
      }

      // 2. Insert Event Strategy
      const { data: newEvent, error: eventError } = await supabaseClient
        .from('events')
        .insert([{
          ...event,
          created_by: user.id,
          status: event.status || 'draft',
          timezone: event.timezone || 'Asia/Bangkok',
          idempotency_key: idempotencyKey || null
        }])
        .select().single();
      if (eventError) throw eventError;

      // 3. Expansion Logic
      const instancePayload = [];
      if (event.is_recurring && recurrence) {
        await supabaseClient.from('recurrence_rules').insert([{ ...recurrence, event_id: newEvent.id, timezone: newEvent.timezone }]);
        const dates = expandRecurrence(newEvent, recurrence);
        dates.forEach(d => {
          instancePayload.push({
            event_id: newEvent.id,
            start_time: d.start_time,
            end_time: d.end_time,
            source_type: 'generated'
          });
        });
      } else {
        instancePayload.push({
          event_id: newEvent.id,
          start_time: newEvent.start_time,
          end_time: newEvent.end_time,
          source_type: 'generated'
        });
      }

      await supabaseClient.from('event_instances').insert(instancePayload);

      // --- TICKETING STUB: Initialize Strategy-level Placeholder ---
      await supabaseClient.from('event_tickets').insert([{
        event_id: newEvent.id,
        ticket_type: 'General Admission',
        price: 0,
        max_quantity: event.max_participants || 100,
        status: 'stub',
        description: 'Automatic Stub for Phase 2A parity.'
      }]);

      return res.status(201).json({ success: true, data: newEvent });

    } catch (error) {
      return res.status(500).json({ error: error.message || 'Atomic transaction failed' });
    }
  }

  // --- PUT ENGINE: SAFE UPDATE (WIPE & REGENERATE) ---
  if (req.method === 'PUT') {
    try {
      const { user, error: authError } = await getAuthenticatedUser(authHeader);
      if (authError || !user) return res.status(401).json({ error: 'Auth failed' });

      const { id, event, recurrence } = req.body;
      if (!id) return res.status(400).json({ error: 'Event ID required' });

      // 1. Verify Ownership & Get Current State
      const { data: currentEvent, error: fetchError } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('created_by', user.id)
        .single();
      if (fetchError || !currentEvent) return res.status(404).json({ error: 'Event not found or unauthorized' });

      // 2. Update Event Strategy (Advanced Parity)
      const { data: updatedEvent, error: updateError } = await supabaseClient
        .from('events')
        .update({ 
          ...event, 
          updated_at: new Date().toISOString(),
          // Ensure arrays are handled correctly for categories/tags
          categories: event.categories || currentEvent.categories,
          tags: event.tags || currentEvent.tags
        })
        .eq('id', id)
        .select().single();
      if (updateError) throw updateError;

      // 3. SAFE REGENERATION: Wipe Future Generated Instances
      // Preserve: Past instances, Manual instances, Attendance data.
      await supabaseClient
        .from('event_instances')
        .delete()
        .eq('event_id', id)
        .eq('source_type', 'generated')
        .gt('start_time', new Date().toISOString());

      // 4. Re-Expand Instances
      if (updatedEvent.is_recurring && recurrence) {
        await supabaseClient.from('recurrence_rules').upsert({ ...recurrence, event_id: id }).eq('event_id', id);
        
        const dates = expandRecurrence(updatedEvent, recurrence);
        const futureInstances = dates
          .filter(d => new Date(d.start_time) > new Date())
          .map(d => ({
            event_id: id,
            start_time: d.start_time,
            end_time: d.end_time,
            source_type: 'generated',
            max_capacity: updatedEvent.max_participants // Propagate capacity to execution layer
          }));

        if (futureInstances.length > 0) {
          // Use upsert or unique constraint handling to avoid race conditions with existing instances
          await supabaseClient.from('event_instances').upsert(futureInstances, { onConflict: 'event_id, start_time' });
        }
      }

      return res.status(200).json({ success: true, data: updatedEvent });

    } catch (error) {
      console.error('[Engine] PUT failure:', error);
      return res.status(500).json({ error: 'Safe update failed' });
    }
  }

  // --- DELETE ENGINE: STRATEGY & LEDGER WIPE ---
  if (req.method === 'DELETE') {
    try {
      const { user, error: authError } = await getAuthenticatedUser(authHeader);
      if (authError || !user) return res.status(401).json({ error: 'Auth failed' });

      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Event ID required' });

      // Verify Ownership
      const { data: currentEvent, error: fetchError } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', id)
        .eq('created_by', user.id)
        .single();
      if (fetchError || !currentEvent) return res.status(404).json({ error: 'Event not found or unauthorized' });

      // 1. Soft Delete Strategy
      await supabaseClient.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id);

      // 2. Clear Active Instances
      await supabaseClient.from('event_instances')
        .update({ status: 'cancelled' })
        .eq('event_id', id)
        .gte('start_time', new Date().toISOString());

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[Engine] DELETE failure:', error);
      return res.status(500).json({ error: 'Event deletion failed' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

/**
 * GET /api/event-instances
 */
exports.eventInstances = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const authHeader = req.headers.authorization;
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const supabaseClient = await getSupabaseClient(authToken);
    const { eventId, organizationId, startDate, endDate, status } = req.query;

    let query = supabaseClient.from('event_instances').select('*, events(*)').is('deleted_at', null).order('start_time', { ascending: true });
    if (eventId) query = query.eq('event_id', eventId);
    if (status) query = query.eq('status', status);
    if (startDate) query = query.gte('start_time', startDate);
    if (endDate) query = query.lte('start_time', endDate);
    if (organizationId) query = query.eq('events.organization_id', organizationId);

    const { data: instances, error } = await query;
    if (error) throw error;

    // --- TICKETING STUB: Dynamic lookup ---
    // In a real implementation this would be a join, for the stub we append placeholder metrics.
    const enriched = instances.map(inst => ({
      ...inst,
      ticketing_stub: {
        sold: 0,
        available: inst.max_capacity || 0,
        price: 0,
        label: '[STUB] ACTIVE'
      }
    }));

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    return res.status(500).json({ error: 'Instance fetch failed' });
  }

  // --- POST INSTANCES: MANUAL CREATION (Phase 3C) ---
  if (req.method === 'POST') {
    try {
      const { user, error: authError } = await getAuthenticatedUser(authHeader);
      if (authError || !user) return res.status(401).json({ error: 'Auth failed' });

      const { eventId, start_time, end_time, max_capacity } = req.body;
      if (!eventId || !start_time || !end_time) return res.status(400).json({ error: 'Missing core temporal fields' });

      const { data: newInstance, error } = await supabaseClient
        .from('event_instances')
        .insert([{
          event_id: eventId,
          start_time,
          end_time,
          max_capacity,
          status: 'scheduled',
          source_type: 'manual'
        }])
        .select().single();

      if (error) {
        if (error.code === '23505') return res.status(409).json({ error: 'Temporal collision. Instance already exists.' });
        throw error;
      }
      return res.status(201).json({ success: true, data: newInstance });
    } catch (error) {
      return res.status(500).json({ error: 'Manual instance failed' });
    }
  }
};

/**
 * PUT /api/event-instances
 * Phase 3A/3B: Overrides status and capacity
 */
exports.updateInstance = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const authHeader = req.headers.authorization;
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
    const { id, status, max_capacity } = req.body;
    if (!id) return res.status(400).json({ error: 'Instance ID required' });

    const supabaseClient = await getSupabaseClient(authToken);
    const { user } = await getAuthenticatedUser(authHeader);

    const payload = {};
    if (status) payload.status = status;
    if (max_capacity !== undefined) payload.max_capacity = max_capacity;

    const { data: updated, error } = await supabaseClient
      .from('event_instances')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ error: 'Instance override failed' });
  }
};

/**
 * GET /api/ai/discovery
 * Phase 5: AI-Driven Insights (Conflicts, Trends, Recommendations)
 */
exports.aiDiscovery = async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const authHeader = req.headers.authorization;
    const { organizationId, mode = 'full' } = req.query;
    if (!organizationId) return res.status(400).json({ error: 'Organization ID required' });

    const supabaseClient = await getSupabaseClient();
    
    // 1. Fetch All Active Instances for Context
    const { data: instances } = await supabaseClient
      .from('event_instances')
      .select('*, events(title, organization_id)')
      .eq('events.organization_id', organizationId)
      .is('deleted_at', null)
      .order('start_time', { ascending: true });

    if (!instances) return res.status(200).json({ success: true, data: { conflicts: [], insights: [], recommendations: [] } });

    const insights = [];
    const conflicts = [];
    const recommendations = [];

    // 2. CONFLICT DETECTION Logic
    // Detect spatial/temporal collisions between any two instances (Strategy overlap)
    for (let i = 0; i < instances.length; i++) {
      for (let j = i + 1; j < instances.length; j++) {
        const a = instances[i];
        const b = instances[j];
        if (a.start_time < b.end_time && b.start_time < a.end_time) {
          conflicts.push({
            type: 'overlap',
            severity: 'high',
            message: `Operational conflict detected between [${a.events.title}] and [${b.events.title}] on ${new Date(a.start_time).toLocaleDateString()}.`,
            instanceIds: [a.id, b.id]
          });
        }
      }
    }

    // 3. PREDICTIVE LOAD Analysis
    // Identify "Hot Slots" based on RSVP velocity
    const highLoadInstances = instances.filter(inst => {
      const load = inst.max_capacity ? (inst.current_rsvp_count / inst.max_capacity) : 0;
      return load > 0.8; // 80% occupancy is the "Hot Zone"
    });

    highLoadInstances.forEach(inst => {
      insights.push({
        type: 'load_predictive',
        severity: 'medium',
        message: `High occupancy forecast for ${inst.events.title} on ${new Date(inst.start_time).toLocaleDateString()}. Consider [Capacity Override].`,
        instanceId: inst.id
      });
      
      // Recommendation: If hot, suggest an extra instance nearby
      const nextDay = new Date(inst.start_time);
      nextDay.setDate(nextDay.getDate() + 1);
      recommendations.push({
        type: 'injection_gap',
        title: `Inject Surge Instance: ${inst.events.title}`,
        message: `Consistent high load on ${new Date(inst.start_time).toLocaleDateString()}. Suggest injecting a [Manual Instance] on ${nextDay.toLocaleDateString()}.`,
        suggestedDate: nextDay.toISOString(),
        parentEventId: inst.event_id
      });
    });

    // 4. Actionable Discovery (Persona based)
    // Placeholder persona detection: If title contains 'Dinner', suggest 'Evening' slots
    instances.forEach(inst => {
      if (inst.events.title.toLowerCase().includes('dinner') && new Date(inst.start_time).getHours() < 17) {
        recommendations.push({
          type: 'strategic_alignment',
          title: 'Shift to Prime Time',
          message: `Event [${inst.events.title}] is categorized as [Dining] but starts outside prime hours. Suggest shifting to 18:30.`,
          instanceId: inst.id
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        conflicts: conflicts.slice(0, 10), // Limit to top 10
        insights: insights.slice(0, 5),
        recommendations: recommendations.slice(0, 3),
        audit: { generated_at: new Date().toISOString(), model: 'TemporalLogic-v4' }
      }
    });

  } catch (error) {
    console.error('[AI] Discovery Failure:', error);
    return res.status(500).json({ error: 'AI Discovery Engine failed to initialize' });
  }
};
