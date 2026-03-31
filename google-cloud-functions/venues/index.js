// [2025-12-02] - Venues API Google Cloud Function
// GET /api/venues - List all venues
// POST /api/venues - Create new venue

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token, X-Supabase-Token, X-Original-Authorization');

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
        console.warn('[Venues API] Error setting auth session:', err.message);
      }
    }

    if (req.method === 'GET') {
      // List all venues
      const client = supabaseAdmin || supabase;
      
      if (!supabaseAdmin) {
        console.log('[Venues API] Using anon key with user session for RLS');
      } else {
        console.log('[Venues API] Using service role key (bypassing RLS)');
      }
      
      const { data, error } = await client
        .from('venues')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('[Venues API] Error fetching venues:', error);
        return res.status(500).json({
          error: 'Failed to fetch venues',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

    if (req.method === 'POST') {
      // Create new venue
      const { name, description, address, latitude, longitude, map_url, image_url, venue_type, capacity } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Venue name is required'
        });
      }

      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();

      // Use service role for insert to bypass RLS
      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('venues')
        .insert({
          name: name.trim(),
          description: description || null,
          address: address || null,
          latitude: latitude || null,
          longitude: longitude || null,
          map_url: map_url || null,
          image_url: image_url || null,
          venue_type: venue_type || null,
          capacity: capacity || null,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        console.error('[Venues API] Error creating venue:', error);
        return res.status(500).json({
          error: 'Failed to create venue',
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
    console.error('[Venues API] Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
};

