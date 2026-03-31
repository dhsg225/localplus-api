// [2025-11-29] - Superuser Events API endpoint
// GET /api/events/all - Superuser-only endpoint with pagination, filters, sorting
// PATCH /api/events/all?id=:id - Superuser update with audit logging
// Separate from regular partner endpoints to avoid permission conflicts

const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser } = require('./utils/rbac');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

// [2025-11-29] - Create supabase client with user's auth token for RLS policies
async function getSupabaseClient(authToken = null) {
  const client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
  
  if (authToken) {
    try {
      const { data: { user }, error } = await client.auth.getUser(authToken);
      if (user && !error) {
        await client.auth.setSession({
          access_token: authToken,
          refresh_token: authToken
        });
      }
    } catch (err) {
      console.warn('[Superuser API] Error setting auth session:', err.message);
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

exports.eventsAll = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token, X-Supabase-Token, X-Original-Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // [2025-11-30] - COMPREHENSIVE LOGGING: Log ALL headers to trace token transformation
  console.log('=== TOKEN TRANSFORMATION INVESTIGATION ===');
  console.log('[Superuser API] Request method:', req.method);
  console.log('[Superuser API] Request URL:', req.url);
  console.log('[Superuser API] Request path:', req.path);
  console.log('[Superuser API] All request headers:', JSON.stringify(req.headers, null, 2));
  
  // [2025-11-30] - Check for token in various possible locations
  const authHeader = req.headers.authorization;
  const xUserToken = req.headers['x-user-token'];
  const xSupabaseToken = req.headers['x-supabase-token'];
  const xOriginalAuth = req.headers['x-original-authorization'];
  
  console.log('[Superuser API] Authorization header:', authHeader ? `${authHeader.substring(0, 50)}...` : 'NOT PRESENT');
  console.log('[Superuser API] X-User-Token header:', xUserToken ? `${xUserToken.substring(0, 50)}...` : 'NOT PRESENT');
  console.log('[Superuser API] X-Supabase-Token header:', xSupabaseToken ? `${xSupabaseToken.substring(0, 50)}...` : 'NOT PRESENT');
  console.log('[Superuser API] X-Original-Authorization header:', xOriginalAuth ? `${xOriginalAuth.substring(0, 50)}...` : 'NOT PRESENT');
  
  // [2025-11-30] - Determine which token to use (prefer custom headers if present)
  let tokenToUse = authHeader;
  if (xOriginalAuth) {
    console.log('[Superuser API] ⚠️ Using X-Original-Authorization header (token may have been transformed)');
    tokenToUse = xOriginalAuth.startsWith('Bearer ') ? xOriginalAuth : `Bearer ${xOriginalAuth}`;
  } else if (xSupabaseToken) {
    console.log('[Superuser API] ⚠️ Using X-Supabase-Token header');
    tokenToUse = xSupabaseToken.startsWith('Bearer ') ? xSupabaseToken : `Bearer ${xSupabaseToken}`;
  } else if (xUserToken) {
    console.log('[Superuser API] ⚠️ Using X-User-Token header');
    tokenToUse = xUserToken.startsWith('Bearer ') ? xUserToken : `Bearer ${xUserToken}`;
  }
  
  if (!tokenToUse) {
    console.error('[Superuser API] ❌ No authentication token found in any header');
    return res.status(401).json({ error: 'Authentication required' });
  }

  // [2025-11-30] - Debug: Log token info and check for token transformation
  const tokenPreview = tokenToUse.replace('Bearer ', '').substring(0, 50);
  const token = tokenToUse.replace('Bearer ', '');
  console.log('[Superuser API] Using token, preview:', tokenPreview + '...');
  console.log('[Superuser API] Token length:', token.length);
  
  // [2025-11-30] - Check if token is being transformed (decode header to see algorithm)
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length === 3) {
      const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString('utf-8'));
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString('utf-8'));
      console.log('[Superuser API] Token algorithm from header:', header.alg);
      console.log('[Superuser API] Token type:', header.typ);
      console.log('[Superuser API] Token issuer (iss):', payload.iss);
      console.log('[Superuser API] Token subject (sub):', payload.sub);
      console.log('[Superuser API] Token email:', payload.email);
      console.log('[Superuser API] Token audience (aud):', payload.aud);
      
      // [2025-11-30] - Check if this is a service account token
      if (payload.email && payload.email.includes('@developer.gserviceaccount.com')) {
        console.error('[Superuser API] ⚠️⚠️⚠️ SERVICE ACCOUNT TOKEN DETECTED ⚠️⚠️⚠️');
        console.error('[Superuser API] This means the token was transformed/replaced!');
        console.error('[Superuser API] Original token should be HS256 (Supabase), but received RS256 (Google OAuth)');
      }
    }
  } catch (e) {
    console.warn('[Superuser API] Could not decode token:', e.message);
  }
  
  console.log('=== END TOKEN INVESTIGATION ===');

  // [2025-11-30] - Use tokenToUse (which may be from custom headers) instead of authHeader
  const { user, error: authError } = await getAuthenticatedUser(tokenToUse);
  if (authError || !user) {
    console.error('[Superuser API] Authentication failed:', authError);
    return res.status(401).json({ error: authError || 'Invalid authentication' });
  }
  
  console.log('[Superuser API] ✅ User authenticated:', user.id, user.email);

  const authToken = tokenToUse.replace('Bearer ', '');
  const supabaseClient = await getSupabaseClient(authToken);

  // Verify super admin
  const userIsSuperAdmin = await isSuperAdmin(supabaseClient, user.id);
  if (!userIsSuperAdmin) {
    return res.status(403).json({ error: 'Super admin access required' });
  }

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

      // Build query with full event details for view modal
      // [2025-11-30] - Added description, subtitle, hero_image_url, and other fields for EventOn-style view
      let query = supabaseClient
        .from('events')
        .select(`
          id,
          title,
          description,
          subtitle,
          status,
          start_time,
          end_time,
          event_type,
          business_id,
          created_by,
          created_at,
          updated_at,
          location,
          venue_area,
          hero_image_url,
          theme_color_hex,
          venue_map_url,
          learn_more_url,
          timezone_id,
          venue_latitude,
          venue_longitude,
          metadata
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

      // [2025-12-01] - Resolve event_type (comma-separated term IDs) to category names
      if (events && events.length > 0) {
        // Get all unique term IDs from all events
        const allTermIds = new Set();
        events.forEach(event => {
          if (event.event_type) {
            const ids = event.event_type.split(',').map(id => id.trim()).filter(id => id);
            ids.forEach(id => allTermIds.add(id));
          }
        });

        // Fetch term mappings from wp_term_mapping table
        const termIdsArray = Array.from(allTermIds).map(id => parseInt(id)).filter(id => !isNaN(id));
        let termMapping = {};
        
        if (termIdsArray.length > 0) {
          const { data: mappings, error: mappingError } = await supabaseClient
            .from('wp_term_mapping')
            .select('term_id, name')
            .in('term_id', termIdsArray);
          
          if (!mappingError && mappings) {
            mappings.forEach(m => {
              termMapping[m.term_id] = m.name;
            });
          }
        }

        // Resolve event_type to names for each event
        events.forEach(event => {
          if (event.event_type) {
            const ids = event.event_type.split(',').map(id => id.trim()).filter(id => id);
            const names = ids.map(id => {
              const termId = parseInt(id);
              return termMapping[termId] || id; // Use name if found, otherwise keep ID
            });
            event.event_type_names = names.join(', '); // Add resolved names
            event.event_type_original = event.event_type; // Keep original for filtering
          } else {
            event.event_type_names = 'general';
          }
        });
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
