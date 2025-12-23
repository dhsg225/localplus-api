// [2025-01-XX] - Event Engine Phase 0 + Phase 1: Individual event operations
// Phase 0: GET, PUT, DELETE endpoints
// Phase 1: RBAC authorization checks
// [2025-12-05] - Phase 2: Recurrence support
const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Enable CORS - Set headers FIRST, before any other processing
  // [2025-01-XX] - Align headers with other endpoints to satisfy preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-token, x-supabase-token, x-original-authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours

  // Handle preflight OPTIONS request - return early before loading any modules
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Lazy init Supabase client after OPTIONS handled
    const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Lazy load modules only after OPTIONS is handled
    const { authorizeRequest } = require('../utils/rbac');
    const cache = require('../utils/cache');

  // Extract ID from URL path
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  // GET /api/events/[id] - Get specific event
  if (req.method === 'GET') {
    try {
      // Phase 1: Check authorization (view access)
      const { authorized, user, error: authError } = await authorizeRequest(req, id, 'view');

      // Allow unauthenticated access to published events
      if (!authorized && !user) {
        // Check if event is published
        const { data: event } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .eq('status', 'published')
          .single();

        if (event) {
          return res.status(200).json({
            success: true,
            data: event
          });
        }

        return res.status(401).json({ error: authError || 'Unauthorized' });
      }

      if (!authorized) {
        return res.status(403).json({ error: authError || 'Insufficient permissions' });
      }

      const { data: event, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Event not found' });
        }
        console.error('Error fetching event:', error);
        return res.status(500).json({ error: 'Failed to fetch event' });
      }

      // [2025-12-05] - Fetch recurrence rule if event is recurring
      if (event && event.is_recurring) {
        const { data: rule, error: ruleError } = await supabase
          .from('recurrence_rules')
          .select('*')
          .eq('event_id', id)
          .single();

        if (rule && !ruleError) {
          event.recurrence_rule = rule;
        }
      }

      return res.status(200).json({
        success: true,
        data: event
      });

    } catch (error) {
      console.error('Event GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /api/events/[id] - Update event
  if (req.method === 'PUT') {
    try {
      // Phase 1: Require edit permission
      const { authorized, error: authError } = await authorizeRequest(req, id, 'edit');

      if (!authorized) {
        return res.status(403).json({ error: authError || 'Insufficient permissions to edit event' });
      }

      const updateData = req.body;

      // [2025-12-05] - Extract recurrence_rules if present
      const recurrenceRules = updateData.recurrence_rules;
      delete updateData.recurrence_rules; // Remove from event data

      // Validate time range if both times are provided
      if (updateData.start_time && updateData.end_time) {
        if (new Date(updateData.end_time) <= new Date(updateData.start_time)) {
          return res.status(400).json({ 
            error: 'end_time must be after start_time' 
          });
        }
      }

      // Don't allow changing created_by
      delete updateData.created_by;

      // [2025-12-05] - Set is_recurring flag if recurrence_rules provided
      if (recurrenceRules !== undefined) {
        updateData.is_recurring = recurrenceRules ? true : false;
      }

      const { data: event, error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        return res.status(500).json({ error: 'Failed to update event' });
      }

      // [2025-12-05] - Update or create recurrence rule if provided
      if (recurrenceRules !== undefined) {
        if (recurrenceRules && event.is_recurring) {
          // Check if rule exists
          const { data: existingRule } = await supabase
            .from('recurrence_rules')
            .select('id')
            .eq('event_id', id)
            .single();

          const ruleData = {
            event_id: id,
            frequency: recurrenceRules.frequency,
            interval: recurrenceRules.interval || 1,
            byweekday: recurrenceRules.byweekday || null,
            bymonthday: recurrenceRules.bymonthday || null,
            bysetpos: recurrenceRules.bysetpos || null,
            until: recurrenceRules.until || null,
            count: recurrenceRules.count || null,
            exceptions: recurrenceRules.exceptions || [],
            additional_dates: recurrenceRules.additional_dates || [],
            timezone: recurrenceRules.timezone || event.timezone_id || 'UTC'
          };

          if (existingRule) {
            // Update existing rule
            const { error: ruleError } = await supabase
              .from('recurrence_rules')
              .update(ruleData)
              .eq('event_id', id);

            if (ruleError) {
              console.error('Error updating recurrence rule:', ruleError);
            } else {
              cache.clearEventCache(id);
            }
          } else {
            // Create new rule
            const { error: ruleError } = await supabase
              .from('recurrence_rules')
              .insert([ruleData]);

            if (ruleError) {
              console.error('Error creating recurrence rule:', ruleError);
            } else {
              cache.clearEventCache(id);
            }
          }
        } else if (!recurrenceRules && event.is_recurring === false) {
          // Delete recurrence rule if event is no longer recurring
          await supabase
            .from('recurrence_rules')
            .delete()
            .eq('event_id', id);
          cache.clearEventCache(id);
        }
      }

      return res.status(200).json({
        success: true,
        data: event
      });

    } catch (error) {
      console.error('Event PUT error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /api/events/[id] - Delete event
  if (req.method === 'DELETE') {
    try {
      // Phase 1: Require owner permission
      const { authorized, error: authError } = await authorizeRequest(req, id, 'delete');

      if (!authorized) {
        return res.status(403).json({ error: authError || 'Only event owners can delete events' });
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        return res.status(500).json({ error: 'Failed to delete event' });
      }

      return res.status(200).json({
        success: true,
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Event DELETE error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    // Ensure CORS headers are sent even on errors
    console.error('[events/[id]] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

