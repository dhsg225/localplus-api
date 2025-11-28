// [2025-01-XX] - Event Engine Phase 0 + Phase 1: Main events API endpoints
// Phase 0: Basic CRUD operations
// Phase 1: RBAC integration
const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser, authorizeRequest } = require('./utils/rbac');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/events - List events with filters
  if (req.method === 'GET') {
    try {
      const { businessId, status, eventType, startDate, endDate, limit = '50', offset = '0' } = req.query;

      // Build query
      let query = supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Apply filters
      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      if (status) {
        query = query.eq('status', status);
      } else {
        // Default: show published events or user's own events
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const { user } = await getAuthenticatedUser(authHeader);
          if (user) {
            // Show published events OR events user created OR events user has access to
            query = query.or(`status.eq.published,created_by.eq.${user.id}`);
          } else {
            // No auth: only published events
            query = query.eq('status', 'published');
          }
        } else {
          // No auth: only published events
          query = query.eq('status', 'published');
        }
      }

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      if (startDate) {
        query = query.gte('start_time', startDate);
      }

      if (endDate) {
        query = query.lte('end_time', endDate);
      }

      const { data: events, error } = await query;

      if (error) {
        console.error('Error fetching events:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
      }

      return res.status(200).json({
        success: true,
        data: events || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: events?.length || 0
        }
      });

    } catch (error) {
      console.error('Events GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/events - Create new event
  if (req.method === 'POST') {
    try {
      // Phase 1: Require authentication
      const authHeader = req.headers.authorization;
      const { user, error: authError } = await getAuthenticatedUser(authHeader);

      if (authError || !user) {
        return res.status(401).json({ error: authError || 'Authentication required' });
      }

      const eventData = req.body;

      // Validate required fields
      if (!eventData.title || !eventData.start_time || !eventData.end_time) {
        return res.status(400).json({ 
          error: 'Title, start_time, and end_time are required' 
        });
      }

      // Validate time range
      if (new Date(eventData.end_time) <= new Date(eventData.start_time)) {
        return res.status(400).json({ 
          error: 'end_time must be after start_time' 
        });
      }

      // Phase 1: Verify user has access to business if business_id provided
      if (eventData.business_id) {
        const { data: userBusiness } = await supabase
          .from('partners')
          .select('business_id')
          .eq('user_id', user.id)
          .eq('business_id', eventData.business_id)
          .eq('is_active', true)
          .single();

        if (!userBusiness) {
          return res.status(403).json({ 
            error: 'You do not have access to this business' 
          });
        }
      }

      // Set created_by
      eventData.created_by = user.id;
      eventData.status = eventData.status || 'draft';

      const { data: event, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ error: 'Failed to create event' });
      }

      // Phase 1: Auto-grant owner permission to creator
      await supabase
        .from('event_permissions')
        .insert([{
          event_id: event.id,
          user_id: user.id,
          role: 'owner',
          granted_by: user.id
        }]);

      return res.status(201).json({
        success: true,
        data: event
      });

    } catch (error) {
      console.error('Events POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

