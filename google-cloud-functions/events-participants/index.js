// [2025-01-XX] - Event Engine Phase 0 + Phase 1: Event participants management
// Phase 0: List and register participants
// Phase 1: RBAC for participant management
const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser, authorizeRequest } = require('./utils/rbac');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.eventsParticipants = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract event ID or instance ID from URL path
  const eventId = req.query.id || req.query.eventId;
  const instanceId = req.query.instanceId;

  if (!eventId && !instanceId) {
    return res.status(400).json({ error: 'Event or Instance ID is required' });
  }

  // GET /api/events/[id]/participants - List event participants
  if (req.method === 'GET') {
    try {
      // Phase 1: Check if user can view participants
      const { authorized, error: authError } = await authorizeRequest(req, eventId, 'view');

      if (!authorized) {
        return res.status(403).json({ error: authError || 'Insufficient permissions' });
      }

      let query = supabase
        .from('event_participants')
        .select('*, user_id, role, status, registered_at')
        .is('deleted_at', null)
        .order('registered_at', { ascending: false });

      if (instanceId) {
        query = query.eq('instance_id', instanceId);
      } else {
        query = query.eq('event_id', eventId);
      }

      if (error) {
        console.error('Error fetching participants:', error);
        return res.status(500).json({ error: 'Failed to fetch participants' });
      }

      return res.status(200).json({
        success: true,
        data: participants || []
      });

    } catch (error) {
      console.error('Participants GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/events/[id]/participants - Register for event
  if (req.method === 'POST') {
    try {
      // Phase 1: Require authentication
      const authHeader = req.headers.authorization;
      const { user, error: authError } = await getAuthenticatedUser(authHeader);

      if (authError || !user) {
        return res.status(401).json({ error: authError || 'Authentication required' });
      }

      // 2. Load Hierarchy (Instance -> Event)
      let currentEvent = null;
      let currentInstance = null;

      if (instanceId) {
        const { data: inst } = await supabase.from('event_instances').select('*, events(*)').eq('id', instanceId).single();
        if (!inst) return res.status(404).json({ error: 'Instance not found' });
        currentInstance = inst;
        currentEvent = inst.events;
      } else {
        const { data: ev } = await supabase.from('events').select('*').eq('id', eventId).single();
        if (!ev) return res.status(404).json({ error: 'Event not found' });
        currentEvent = ev;
      }

      const activeEventId = currentEvent.id;

      // 3. Status Verification
      if (currentEvent.status !== 'published') return res.status(400).json({ error: 'Event strategy is not public' });
      if (currentInstance && currentInstance.status === 'cancelled') return res.status(400).json({ error: 'This specific date is a No-Go' });

      // 4. Capacity Enforcement (Temporal Logic)
      const maxCap = currentInstance?.max_capacity || currentEvent.max_participants;
      if (maxCap) {
        const { count } = await supabase
          .from('event_participants')
          .select('*', { count: 'exact', head: true })
          .eq(instanceId ? 'instance_id' : 'event_id', instanceId || activeEventId)
          .in('status', ['confirmed', 'pending']);

        if (count >= maxCap) return res.status(400).json({ error: 'Operational capacity reached' });
      }

      // 5. Registration Check
      const { data: existing } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', activeEventId)
        .eq('user_id', user.id)
        .filter(instanceId ? 'instance_id' : 'id', instanceId ? 'eq' : 'not.is', instanceId || null)
        .single();

      if (existing) {
        return res.status(400).json({ error: 'Already registered for this event' });
      }

      // 6. Finalize Registration
      const participantData = {
        event_id: activeEventId,
        instance_id: instanceId || null,
        user_id: user.id,
        role: req.body.role || 'attendee',
        status: 'pending' // Defaults to pending for confirmation flow
      };

      const { data: participant, error } = await supabase
        .from('event_participants')
        .insert([participantData])
        .select()
        .single();

      if (error) {
        console.error('Error registering participant:', error);
        return res.status(500).json({ error: 'Failed to register for event' });
      }

      return res.status(201).json({
        success: true,
        data: participant
      });

    } catch (error) {
      console.error('Participants POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /api/events/[id]/participants - Update participant status (confirm/cancel)
  if (req.method === 'PUT') {
    try {
      const authHeader = req.headers.authorization;
      const { user, error: authError } = await getAuthenticatedUser(authHeader);

      if (authError || !user) {
        return res.status(401).json({ error: authError || 'Authentication required' });
      }

      const { participantId, status } = req.body;

      if (!participantId || !status) {
        return res.status(400).json({ error: 'participantId and status are required' });
      }

      // Check if user is updating their own status or has manage permissions
      const { data: participant } = await supabase
        .from('event_participants')
        .select('user_id, event_id')
        .eq('id', participantId)
        .single();

      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      const isOwnStatus = participant.user_id === user.id;
      const { authorized } = await authorizeRequest(req, participant.event_id, 'manage_participants');

      if (!isOwnStatus && !authorized) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const updateData = { status };
      if (status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      }

      const { data: updatedParticipant, error } = await supabase
        .from('event_participants')
        .update(updateData)
        .eq('id', participantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating participant:', error);
        return res.status(500).json({ error: 'Failed to update participant' });
      }

      return res.status(200).json({
        success: true,
        data: updatedParticipant
      });

    } catch (error) {
      console.error('Participants PUT error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // DELETE /api/events/[id]/participants - Cancel registration
  if (req.method === 'DELETE') {
    try {
      const authHeader = req.headers.authorization;
      const { user, error: authError } = await getAuthenticatedUser(authHeader);

      if (authError || !user) {
        return res.status(401).json({ error: authError || 'Authentication required' });
      }

      const { participantId } = req.query;

      if (!participantId) {
        return res.status(400).json({ error: 'participantId is required' });
      }

      // Check if user is canceling their own registration or has manage permissions
      const { data: participant } = await supabase
        .from('event_participants')
        .select('user_id, event_id')
        .eq('id', participantId)
        .single();

      if (!participant) {
        return res.status(404).json({ error: 'Participant not found' });
      }

      const isOwnRegistration = participant.user_id === user.id;
      const { authorized } = await authorizeRequest(req, participant.event_id, 'manage_participants');

      if (!isOwnRegistration && !authorized) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('id', participantId);

      if (error) {
        console.error('Error canceling registration:', error);
        return res.status(500).json({ error: 'Failed to cancel registration' });
      }

      return res.status(200).json({
        success: true,
        message: 'Registration canceled successfully'
      });

    } catch (error) {
      console.error('Participants DELETE error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

