// [2025-11-29] - Superuser Events API endpoint
// GET /api/events/all - Superuser-only endpoint with pagination, filters, sorting
// PATCH /api/events/all?id=:id - Superuser update with audit logging
// Separate from regular partner endpoints to avoid permission conflicts

const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser, isEventsSuperuser } = require('../utils/rbac');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

// [2025-11-29] - Create supabase client with user's auth token for RLS policies
async function getSupabaseClient(authToken = null) {
  // Configure client with auth token in headers for RLS
  const clientOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  };
  
  // If auth token provided, include it in global headers for all requests
  if (authToken) {
    clientOptions.global = {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    };
    
    try {
      // Also set session for auth.uid() to work in RLS policies
      const client = createClient(supabaseUrl, supabaseKey, clientOptions);
      const { data: { user }, error } = await client.auth.getUser(authToken);
      if (user && !error) {
        await client.auth.setSession({
          access_token: authToken,
          refresh_token: authToken
        });
        console.log('[Superuser API] Session set for user:', user.id);
      } else {
        console.warn('[Superuser API] Failed to get user from token:', error);
      }
      return client;
    } catch (err) {
      console.warn('[Superuser API] Error setting auth session:', err.message);
      // Return client anyway, headers should still work
      return createClient(supabaseUrl, supabaseKey, clientOptions);
    }
  }
  
  return createClient(supabaseUrl, supabaseKey, clientOptions);
}

// [2025-11-29] - Check if user is super admin
async function isSuperAdmin(supabaseClient, userId) {
  const { data: userRoles, error } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'super_admin')
    .eq('is_active', true)
    .limit(1);

  if (error) {
    console.error('[Superuser API] Error checking super admin:', error);
    return false;
  }

  return userRoles && userRoles.length > 0;
}

// [2025-11-29] - Log superuser action to audit table
async function logAuditAction(supabaseClient, eventId, adminUserId, action, previousData, newData, changedFields, reason, req) {
  try {
    await supabaseClient
      .from('event_audit_logs')
      .insert([{
        event_id: eventId,
        admin_user_id: adminUserId,
        action,
        previous_data: previousData,
        new_data: newData,
        changed_fields: changedFields,
        reason,
        ip_address: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null,
        user_agent: req.headers['user-agent'] || null
      }]);
  } catch (err) {
    console.error('[Superuser API] Error logging audit action:', err);
    // Don't fail the request if audit logging fails
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Require authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { user, error: authError } = await getAuthenticatedUser(authHeader);
  if (authError || !user) {
    return res.status(401).json({ error: authError || 'Invalid authentication' });
  }

  const authToken = authHeader.replace('Bearer ', '');
  const supabaseClient = await getSupabaseClient(authToken);

  // [2025-01-XX] - Verify super admin OR events_superuser
  console.log('[Superuser API] Checking access for user:', user.id);
  const userIsSuperAdmin = await isSuperAdmin(supabaseClient, user.id);
  const userIsEventsSuperuser = await isEventsSuperuser(supabaseClient, user.id);
  
  console.log('[Superuser API] userIsSuperAdmin:', userIsSuperAdmin);
  console.log('[Superuser API] userIsEventsSuperuser:', userIsEventsSuperuser);
  
  if (!userIsSuperAdmin && !userIsEventsSuperuser) {
    console.log('[Superuser API] Access denied - neither super_admin nor events_superuser');
    return res.status(403).json({ error: 'Super admin access required' });
  }
  
  console.log('[Superuser API] Access granted');

  // GET /api/events/all - List all events with filters, pagination, sorting
  if (req.method === 'GET') {
    try {
      const {
        // Pagination
        limit = '50',
        offset = '0',
        
        // Filters
        city,
        businessId,
        category,
        status,
        eventType,
        createdBy,
        startDate,
        endDate,
        onlyUpcoming,
        onlyScraped,
        needsReview,
        
        // Sorting
        sortBy = 'start_time', // 'start_time', 'created_at', 'title'
        sortOrder = 'asc' // 'asc', 'desc'
      } = req.query;

      // Build query with slim payload (performance optimization)
      let query = supabaseClient
        .from('events')
        .select(`
          id,
          title,
          status,
          start_time,
          end_time,
          event_type,
          business_id,
          created_by,
          created_at,
          updated_at,
          location,
          venue_area
        `)
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      // Apply filters
      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (eventType || category) {
        query = query.eq('event_type', eventType || category);
      }

      if (createdBy) {
        query = query.eq('created_by', createdBy);
      }

      if (startDate) {
        query = query.gte('start_time', startDate);
      }

      if (endDate) {
        query = query.lte('end_time', endDate);
      }

      if (onlyUpcoming === 'true') {
        query = query.gte('start_time', new Date().toISOString());
      }

      if (onlyScraped === 'true') {
        query = query.eq('status', 'scraped_draft');
      }

      // Sorting
      const validSortFields = ['start_time', 'created_at', 'title'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'start_time';
      const order = sortOrder === 'desc' ? { ascending: false } : { ascending: true };
      query = query.order(sortField, order);

      const { data: events, error } = await query;

      if (error) {
        console.error('[Superuser API] Error fetching events:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
      }

      // Get total count (for pagination) - build count query with same filters
      let countQuery = supabaseClient.from('events').select('*', { count: 'exact', head: true });
      
      // Apply same filters to count query
      if (businessId) countQuery = countQuery.eq('business_id', businessId);
      if (status) countQuery = countQuery.eq('status', status);
      if (eventType || category) countQuery = countQuery.eq('event_type', eventType || category);
      if (createdBy) countQuery = countQuery.eq('created_by', createdBy);
      if (startDate) countQuery = countQuery.gte('start_time', startDate);
      if (endDate) countQuery = countQuery.lte('end_time', endDate);
      if (onlyUpcoming === 'true') countQuery = countQuery.gte('start_time', new Date().toISOString());
      if (onlyScraped === 'true') countQuery = countQuery.eq('status', 'scraped_draft');
      
      const { count: totalCount } = await countQuery;

      return res.status(200).json({
        success: true,
        data: events || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount || 0,
          hasMore: (parseInt(offset) + parseInt(limit)) < (totalCount || 0)
        }
      });

    } catch (error) {
      console.error('[Superuser API] GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PATCH /api/events/all?id=:id - Superuser update with validation and audit logging
  if (req.method === 'PATCH') {
    try {
      // Extract ID from query params (Vercel pattern) or body
      const eventId = req.query.id || req.body.id;
      if (!eventId) {
        return res.status(400).json({ error: 'Event ID required' });
      }

      // Get current event data for audit log
      const { data: currentEvent, error: fetchError } = await supabaseClient
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError || !currentEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      const updateData = req.body;
      const { reason, ...eventUpdates } = updateData; // Separate reason from event data

      // Validation
      if (eventUpdates.start_time && eventUpdates.end_time) {
        if (new Date(eventUpdates.end_time) <= new Date(eventUpdates.start_time)) {
          return res.status(400).json({ error: 'end_time must be after start_time' });
        }
      }

      // Update event
      const { data: updatedEvent, error: updateError } = await supabaseClient
        .from('events')
        .update(eventUpdates)
        .eq('id', eventId)
        .select()
        .single();

      if (updateError) {
        console.error('[Superuser API] Error updating event:', updateError);
        return res.status(500).json({ error: 'Failed to update event' });
      }

      // Determine changed fields
      const changedFields = Object.keys(eventUpdates).filter(key => 
        JSON.stringify(currentEvent[key]) !== JSON.stringify(updatedEvent[key])
      );

      // Log audit action
      await logAuditAction(
        supabaseClient,
        eventId,
        user.id,
        'update',
        currentEvent,
        updatedEvent,
        changedFields,
        reason,
        req
      );

      return res.status(200).json({
        success: true,
        data: updatedEvent
      });

    } catch (error) {
      console.error('[Superuser API] PATCH error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
