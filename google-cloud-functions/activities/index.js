// [2025-12-02] - Activities API endpoint for Google Cloud Functions
// GET /api/activities - List all activities
// POST /api/activities - Create new activity

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token, X-Supabase-Token, X-Original-Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    // Use service role client for GET requests to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });

    // Regular client for POST (needs user context)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Get auth token from headers
    const authHeader = req.get('authorization') || req.get('x-user-token') || req.get('x-supabase-token') || req.get('x-original-authorization');
    const token = authHeader?.replace('Bearer ', '') || authHeader;

    // Set session if token provided
    if (token) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (user && !userError) {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: token
          });
        }
      } catch (err) {
        console.warn('[Activities GCF] Error setting auth session:', err.message);
      }
    }

    if (req.method === 'GET') {
      // List all activities
      const client = supabaseAdmin;

      console.log('[Activities GCF] Fetching activities...');
      const { data, error } = await client
        .from('activities')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('[Activities GCF] Error fetching activities:', error);
        return res.status(500).json({
          error: 'Failed to fetch activities',
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }

      console.log(`[Activities GCF] Found ${data?.length || 0} activities.`);
      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

    if (req.method === 'POST') {
      // Create new activity
      const {
        name, description, subtitle, activity_type, category,
        duration_minutes, price, currency, capacity, min_age, max_age,
        difficulty_level, location_id, venue_id, address, latitude, longitude,
        map_url, hero_image_url, image_urls, video_url, highlights, includes,
        excludes, requirements, what_to_bring, is_available, availability_schedule,
        booking_required, advance_booking_days, status, metadata, tags, business_id
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Activity name is required'
        });
      }

      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated for creating activities.' });
      }

      // Use the regular client (with user session) for insert, RLS will handle permissions
      const { data, error } = await supabase
        .from('activities')
        .insert({
          name: name.trim(),
          description: description || null,
          subtitle: subtitle || null,
          activity_type: activity_type || null,
          category: category || null,
          duration_minutes: duration_minutes || null,
          price: price || null,
          currency: currency || 'THB',
          capacity: capacity || null,
          min_age: min_age || null,
          max_age: max_age || null,
          difficulty_level: difficulty_level || null,
          location_id: location_id || null,
          venue_id: venue_id || null,
          address: address || null,
          latitude: latitude || null,
          longitude: longitude || null,
          map_url: map_url || null,
          hero_image_url: hero_image_url || null,
          image_urls: image_urls || [],
          video_url: video_url || null,
          highlights: highlights || [],
          includes: includes || [],
          excludes: excludes || [],
          requirements: requirements || [],
          what_to_bring: what_to_bring || [],
          is_available: is_available !== undefined ? is_available : true,
          availability_schedule: availability_schedule || null,
          booking_required: booking_required !== undefined ? booking_required : true,
          advance_booking_days: advance_booking_days || null,
          status: status || 'draft',
          metadata: metadata || {},
          tags: tags || [],
          business_id: business_id || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('[Activities GCF] Error creating activity:', error);
        return res.status(500).json({
          error: 'Failed to create activity',
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }

      return res.status(201).json({
        success: true,
        data: data
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Activities GCF] Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};

