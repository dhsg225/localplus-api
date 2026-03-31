// [2025-12-02] - Activities API endpoint
// GET /api/activities - List all activities
// POST /api/activities - Create new activity

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token, X-Supabase-Token, X-Original-Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Use service role client for GET requests to bypass RLS
    const supabaseAdmin = supabaseServiceRoleKey 
      ? createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        })
      : null;

    // Regular client for POST (needs user context)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    // Get auth token from headers
    const authHeader = req.headers.authorization || req.headers['x-user-token'] || req.headers['x-supabase-token'] || req.headers['x-original-authorization'];
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
        console.warn('[Activities API] Error setting auth session:', err.message);
      }
    }

    if (req.method === 'GET') {
      // List all activities
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .from('activities')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('[Activities API] Error fetching activities:', error);
        return res.status(500).json({
          error: 'Failed to fetch activities',
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
      }

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

      // Use service role for insert to bypass RLS
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
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
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        console.error('[Activities API] Error creating activity:', error);
        return res.status(500).json({
          error: 'Failed to create activity',
          message: error.message
        });
      }

      return res.status(201).json({
        success: true,
        data: data
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Activities API] Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}

