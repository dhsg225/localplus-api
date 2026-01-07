// [2025-01-XX] - Event Engine Phase 0 + Phase 1: Main events API endpoints
// Phase 0: Basic CRUD operations
// Phase 1: RBAC integration
// [2025-12-05] - Phase 2: Recurrence support with on-the-fly occurrence generation
const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser, authorizeRequest, isEventsSuperuser } = require('./utils/rbac');
const { generateOccurrences, getCacheKey } = require('./utils/recurrence-engine');
const cache = require('./utils/cache');

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

  // Set the session if token provided (required for RLS policies to work)
  if (authToken) {
    try {
      // Verify token and get user
      const { data: { user }, error } = await client.auth.getUser(authToken);
      if (user && !error) {
        // Set session with the token so RLS policies can read auth.uid()
        await client.auth.setSession({
          access_token: authToken,
          refresh_token: authToken
        });
      }
    } catch (err) {
      console.warn('[API] Error setting auth session:', err.message);
    }
  }

  return client;
}

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

      // [2025-11-29] - Get auth token for RLS policies
      const authHeader = req.headers.authorization;
      const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
      const supabaseClient = await getSupabaseClient(authToken);

      // [2025-12-05] - Don't apply range/pagination here if we're expanding recurrences
      // We'll paginate after expanding occurrences
      // Build query
      let query = supabaseClient
        .from('events')
        .select('*')
        .order('start_time', { ascending: true });

      // Apply filters
      if (businessId) {
        query = query.eq('business_id', businessId);
      }

      // [2025-01-XX] - Check for events_superuser/super_admin BEFORE applying status filter
      // This allows superusers to see all events even when status=published is in query
      let isSuperuser = false;
      let isSuperAdmin = false;

      if (authHeader) {
        const { user } = await getAuthenticatedUser(authHeader);
        if (user) {
          isSuperuser = await isEventsSuperuser(supabaseClient, user.id);

          // Check for super_admin role
          const { data: userRoles, error: roleError } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'super_admin')
            .eq('is_active', true)
            .limit(1);

          isSuperAdmin = userRoles && userRoles.length > 0;

          console.log('[API] User ID:', user.id);
          console.log('[API] Is events superuser:', isSuperuser);
          console.log('[API] Is super admin:', isSuperAdmin);
        }
      }

      // Apply status filter only if user is NOT a superuser/admin
      if (status && !isSuperuser && !isSuperAdmin) {
        // Regular users: apply status filter
        query = query.eq('status', status);
        console.log('[API] Regular user - applying status filter:', status);
      } else if (!status) {
        // No status specified - apply default logic
        if (isSuperuser || isSuperAdmin) {
          // Superusers can see ALL events (no status filter)
          console.log('[API] Super user/admin - no status filter applied');
        } else if (authHeader) {
          // Regular authenticated users: show published events OR events they created
          const { user } = await getAuthenticatedUser(authHeader);
          if (user) {
            query = query.or(`status.eq.published,created_by.eq.${user.id}`);
            console.log('[API] Regular user - showing published or own events');
          } else {
            query = query.eq('status', 'published');
          }
        } else {
          // No auth: only published events
          query = query.eq('status', 'published');
        }
      } else {
        // Status provided but user is superuser/admin - ignore status filter
        console.log('[API] Super user/admin - ignoring status filter, showing all events');
      }

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      // [2025-12-05] - Don't filter by startDate/endDate on parent events
      // Recurring events might have occurrences in range even if parent is outside
      // We'll filter occurrences after expansion

      const { data: events, error } = await query;

      console.log('[API] Query result:', {
        eventsCount: events?.length || 0,
        error: error?.message || null,
        hasData: !!events
      });

      if (error) {
        console.error('[API] Error fetching events:', error);
        return res.status(500).json({ error: 'Failed to fetch events' });
      }

      // [2025-12-05] - Expand recurring events into occurrences
      const allResults = [];
      const dateRangeStart = startDate || new Date().toISOString().split('T')[0];
      const dateRangeEnd = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Default: 1 year ahead

      // Fetch all recurrence rules in one go for all recurring events found
      const recurringEventIds = (events || [])
        .filter(e => e.is_recurring)
        .map(e => e.id);

      let recurrenceRules = [];
      if (recurringEventIds.length > 0) {
        const { data: rules, error: rulesError } = await supabaseClient
          .from('recurrence_rules')
          .select('*')
          .in('event_id', recurringEventIds);

        if (!rulesError) {
          recurrenceRules = rules;
        } else {
          console.error('[API] Error fetching recurrence rules:', rulesError);
        }
      }

      for (const event of events || []) {
        if (event.is_recurring) {
          const rule = recurrenceRules.find(r => r.event_id === event.id);

          if (rule) {
            // Check cache first
            const cacheKey = getCacheKey(event.id, dateRangeStart, dateRangeEnd);
            let occurrences = cache.get(cacheKey);

            if (!occurrences) {
              // Generate occurrences
              occurrences = generateOccurrences(event, rule, dateRangeStart, dateRangeEnd);
              // Cache for 5 minutes
              cache.set(cacheKey, occurrences);
            }

            // Add occurrences to results
            allResults.push(...occurrences);
          } else {
            // No rule found (or error fetching), add parent event as-is
            allResults.push(event);
          }
        } else {
          // Non-recurring event, add as-is
          allResults.push(event);
        }
      }

      // [2025-12-05] - Filter by date range if provided
      let filteredResults = allResults;
      if (startDate || endDate) {
        filteredResults = allResults.filter(event => {
          const eventStart = new Date(event.start_time);
          if (startDate && eventStart < new Date(startDate)) {
            return false;
          }
          if (endDate && eventStart > new Date(endDate)) {
            return false;
          }
          return true;
        });
      }

      // Sort by start_time
      filteredResults.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

      // Apply pagination to final results
      const paginatedResults = filteredResults.slice(
        parseInt(offset),
        parseInt(offset) + parseInt(limit)
      );

      return res.status(200).json({
        success: true,
        data: paginatedResults,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: filteredResults.length
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

      // [2025-11-29] - Get auth token for RLS policies
      const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
      const supabaseClient = await getSupabaseClient(authToken);

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

      // [2025-01-XX] - Events superuser can create events for any business
      const isSuperuser = await isEventsSuperuser(supabaseClient, user.id);

      // Phase 1: Verify user has access to business if business_id provided
      if (eventData.business_id && !isSuperuser) {
        const { data: userBusiness } = await supabaseClient
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

      // [2025-12-05] - Extract recurrence_rules if present
      const recurrenceRules = eventData.recurrence_rules;
      delete eventData.recurrence_rules; // Remove from event data

      // Set created_by
      eventData.created_by = user.id;
      eventData.status = eventData.status || 'draft';
      eventData.is_recurring = recurrenceRules ? true : (eventData.is_recurring || false);

      const { data: event, error } = await supabaseClient
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return res.status(500).json({ error: 'Failed to create event' });
      }

      // [2025-12-05] - Create recurrence rule if provided
      if (recurrenceRules && event.is_recurring) {
        const ruleData = {
          event_id: event.id,
          frequency: recurrenceRules.frequency,
          interval: recurrenceRules.interval || 1,
          byweekday: recurrenceRules.byweekday || null,
          bymonthday: recurrenceRules.bymonthday || null,
          bysetpos: recurrenceRules.bysetpos || null,
          until: recurrenceRules.until || null,
          count: recurrenceRules.count || null,
          exceptions: recurrenceRules.exceptions || [],
          additional_dates: recurrenceRules.additional_dates || [],
          timezone: recurrenceRules.timezone || eventData.timezone_id || 'UTC'
        };

        const { error: ruleError } = await supabaseClient
          .from('recurrence_rules')
          .insert([ruleData]);

        if (ruleError) {
          console.error('Error creating recurrence rule:', ruleError);
          // Don't fail the request, but log the error
          // The event is created, recurrence can be added later
        } else {
          // Clear cache for this event
          cache.clearEventCache(event.id);
        }
      }

      // Phase 1: Auto-grant owner permission to creator
      await supabaseClient
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

