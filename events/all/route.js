// [2025-11-29] - Superuser Events API endpoint
// GET /api/events/all - Superuser-only endpoint with pagination, filters, sorting
// PATCH /api/events/all?id=:id - Superuser update with audit logging
// Separate from regular partner endpoints to avoid permission conflicts

const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser, isEventsSuperuser } = require('../utils/rbac');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
// [2025-01-XX] - Read service role key from environment
// Try multiple possible env var names (Vercel might use different names)
const supabaseServiceRoleKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  null;

// Debug: Log if service role key is available (but don't log the actual key)
if (supabaseServiceRoleKey) {
  console.log('[Superuser API] ✅ Service role key is configured');
  console.log('[Superuser API] Service role key length:', supabaseServiceRoleKey.length);
  console.log('[Superuser API] Service role key starts with:', supabaseServiceRoleKey.substring(0, 20) + '...');
} else {
  console.warn('[Superuser API] ⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY not set');
  console.warn('[Superuser API] Checked env vars: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_KEY, SUPABASE_SERVICE_ROLE');
  console.warn('[Superuser API] Will fall back to anon client with session (may not work due to RLS)');
}

// [2025-11-29] - Create supabase client with user's auth token for RLS policies
async function getSupabaseClient(authToken = null) {
  // Configure client with auth token in headers for RLS
  const clientOptions = {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: authToken ? {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    } : {}
  };
  
  const client = createClient(supabaseUrl, supabaseKey, clientOptions);
  
  // If auth token provided, set session for auth.uid() to work in RLS policies
  if (authToken) {
    try {
      // Verify token is valid first
      const { data: { user }, error: getUserError } = await client.auth.getUser(authToken);
      if (getUserError) {
        console.warn('[Superuser API] Error getting user from token:', getUserError.message);
        return client; // Return client anyway, headers might work
      }
      
      if (user) {
        // Set session - this is critical for RLS auth.uid() to work
        const { data: sessionData, error: sessionError } = await client.auth.setSession({
          access_token: authToken,
          refresh_token: authToken
        });
        
        if (sessionError) {
          console.warn('[Superuser API] Error setting session:', sessionError.message);
        } else if (sessionData?.session) {
          console.log('[Superuser API] Session set successfully for user:', user.id);
          // Verify auth.uid() is working
          const { data: { user: verifyUser } } = await client.auth.getUser();
          console.log('[Superuser API] Verified auth.uid():', verifyUser?.id || 'NULL');
        } else {
          console.warn('[Superuser API] Session set but no session data returned');
        }
      }
    } catch (err) {
      console.warn('[Superuser API] Exception setting auth session:', err.message);
    }
  }
  
  return client;
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

  // [2025-01-XX] - Use service role client for role checks to bypass RLS
  // This is more reliable than trying to set session on anon client
  const roleCheckClient = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : await getSupabaseClient(authToken);

  // [2025-01-XX] - Verify super admin OR events_superuser
  console.log('[Superuser API] Checking access for user:', user.id);
  console.log('[Superuser API] Service role key present:', !!supabaseServiceRoleKey);
  console.log('[Superuser API] Service role key length:', supabaseServiceRoleKey ? supabaseServiceRoleKey.length : 0);
  console.log('[Superuser API] Using service role for role check:', !!supabaseServiceRoleKey);
  
  // Test query to see what roles exist for this user (with detailed error logging)
  const { data: allRoles, error: allRolesError } = await roleCheckClient
    .from('user_roles')
    .select('role, is_active, user_id')
    .eq('user_id', user.id);
  
  if (allRolesError) {
    console.error('[Superuser API] ERROR querying user_roles:', {
      code: allRolesError.code,
      message: allRolesError.message,
      details: allRolesError.details,
      hint: allRolesError.hint
    });
  } else {
    console.log('[Superuser API] All roles for user:', JSON.stringify(allRoles, null, 2));
    console.log('[Superuser API] Role count:', allRoles?.length || 0);
  }
  
  // Check each role individually with detailed logging
  const userIsSuperAdmin = await isSuperAdmin(roleCheckClient, user.id);
  const userIsEventsSuperuser = await isEventsSuperuser(roleCheckClient, user.id);
  
  console.log('[Superuser API] userIsSuperAdmin:', userIsSuperAdmin);
  console.log('[Superuser API] userIsEventsSuperuser:', userIsEventsSuperuser);
  
  // Additional verification: Check if events_superuser exists in allRoles
  const hasEventsSuperuserInAllRoles = allRoles?.some(r => r.role === 'events_superuser' && r.is_active);
  console.log('[Superuser API] events_superuser found in allRoles query:', hasEventsSuperuserInAllRoles);
  
  if (!userIsSuperAdmin && !userIsEventsSuperuser) {
    console.log('[Superuser API] Access denied - neither super_admin nor events_superuser');
    console.log('[Superuser API] Available roles:', allRoles);
    console.log('[Superuser API] Service role key present:', !!supabaseServiceRoleKey);
    console.log('[Superuser API] Role check client type:', supabaseServiceRoleKey ? 'service_role' : 'anon_with_session');
    return res.status(403).json({ 
      error: 'Super admin access required',
      debug: {
        userId: user.id,
        serviceRoleKeyPresent: !!supabaseServiceRoleKey,
        allRoles: allRoles || [],
        userIsSuperAdmin,
        userIsEventsSuperuser,
        roleCheckError: allRolesError ? allRolesError.message : null
      }
    });
  }

  // Create Supabase client with user's auth token for RLS on events queries
  const supabaseClient = await getSupabaseClient(authToken);
  
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
