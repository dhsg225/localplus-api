// [2025-12-01] - Locations API endpoint
// GET /api/locations - List all locations
// POST /api/locations - Create new location

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
  // CORS headers
  // [2025-01-XX] - Align headers for custom auth headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-token, x-supabase-token, x-original-authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // [2025-12-01] - Use service role client for GET requests to bypass RLS
    // Locations should be viewable by all authenticated users, so we use service role
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

    // Set session if token provided (for both GET and POST to handle RLS)
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
        console.warn('[Locations API] Error setting auth session:', err.message);
      }
    }

    if (req.method === 'GET') {
      // [2025-12-01] - List all locations
      // [2025-01-XX] - Support search parameter for autocomplete
      const { search } = req.query;
      
      // Use service role if available (bypasses RLS), otherwise use anon key with session
      const client = supabaseAdmin || supabase;
      
      // Log for debugging
      if (!supabaseAdmin) {
        console.log('[Locations API] Using anon key with user session for RLS');
      } else {
        console.log('[Locations API] Using service role key (bypassing RLS)');
      }
      
      let query = client
        .from('locations')
        .select('*');
      
      // If search provided, filter by name (case-insensitive)
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.ilike('name', searchTerm);
      }
      
      query = query.order('name', { ascending: true }).limit(50); // Limit results for autocomplete
      
      const { data, error } = await query;

      if (error) {
        console.error('[Locations API] Error fetching locations:', error);
        console.error('[Locations API] Error details:', JSON.stringify(error, null, 2));
        return res.status(500).json({
          error: 'Failed to fetch locations',
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
      // Create new location
      const { name, description, address, latitude, longitude, map_url, image_url } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Location name is required'
        });
      }

      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();

      // Use service role for insert to bypass RLS
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('locations')
        .insert({
          name: name.trim(),
          description: description || null,
          address: address || null,
          latitude: latitude || null,
          longitude: longitude || null,
          map_url: map_url || null,
          image_url: image_url || null,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        console.error('[Locations API] Error creating location:', error);
        return res.status(500).json({
          error: 'Failed to create location',
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
    console.error('[Locations API] Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}

