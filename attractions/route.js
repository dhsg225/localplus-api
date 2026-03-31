// [2025-12-02] - Attractions API endpoint
// GET /api/attractions - List all attractions
// POST /api/attractions - Create new attraction

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
        console.warn('[Attractions API] Error setting auth session:', err.message);
      }
    }

    if (req.method === 'GET') {
      // List all attractions
      const client = supabaseAdmin || supabase;
      
      const { data, error } = await client
        .from('attractions')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('[Attractions API] Error fetching attractions:', error);
        return res.status(500).json({
          error: 'Failed to fetch attractions',
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
      // Create new attraction
      const {
        name, description, subtitle, attraction_type, category, classification,
        location_id, address, latitude, longitude, map_url, area_km2,
        hero_image_url, image_urls, video_url, gallery_url, content,
        highlights, facilities, activities_available, best_time_to_visit,
        opening_hours, admission_fee, admission_currency, is_free,
        accessibility_features, parking_available, parking_fee,
        public_transport_available, public_transport_info, safety_info,
        regulations, restrictions, status, is_featured, metadata, tags,
        external_id, external_source_url, business_id, managed_by_dmo
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Attraction name is required'
        });
      }

      if (!attraction_type) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Attraction type is required'
        });
      }

      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();

      // Use service role for insert to bypass RLS
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('attractions')
        .insert({
          name: name.trim(),
          description: description || null,
          subtitle: subtitle || null,
          attraction_type: attraction_type,
          category: category || null,
          classification: classification || null,
          location_id: location_id || null,
          address: address || null,
          latitude: latitude || null,
          longitude: longitude || null,
          map_url: map_url || null,
          area_km2: area_km2 || null,
          hero_image_url: hero_image_url || null,
          image_urls: image_urls || [],
          video_url: video_url || null,
          gallery_url: gallery_url || null,
          content: content || {},
          highlights: highlights || [],
          facilities: facilities || [],
          activities_available: activities_available || [],
          best_time_to_visit: best_time_to_visit || null,
          opening_hours: opening_hours || null,
          admission_fee: admission_fee || null,
          admission_currency: admission_currency || 'THB',
          is_free: is_free !== undefined ? is_free : true,
          accessibility_features: accessibility_features || [],
          parking_available: parking_available !== undefined ? parking_available : false,
          parking_fee: parking_fee || null,
          public_transport_available: public_transport_available !== undefined ? public_transport_available : false,
          public_transport_info: public_transport_info || null,
          safety_info: safety_info || null,
          regulations: regulations || [],
          restrictions: restrictions || [],
          status: status || 'draft',
          is_featured: is_featured !== undefined ? is_featured : false,
          metadata: metadata || {},
          tags: tags || [],
          external_id: external_id || null,
          external_source_url: external_source_url || null,
          business_id: business_id || null,
          managed_by_dmo: managed_by_dmo !== undefined ? managed_by_dmo : true,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        console.error('[Attractions API] Error creating attraction:', error);
        return res.status(500).json({
          error: 'Failed to create attraction',
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
    console.error('[Attractions API] Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}

