// [2025-12-01] - Organizers API endpoint
// GET /api/organizers - List all organizers
// POST /api/organizers - Create new organizer

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token, X-Supabase-Token, X-Original-Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get auth token from headers
    const authHeader = req.headers.authorization || req.headers['x-user-token'] || req.headers['x-supabase-token'] || req.headers['x-original-authorization'];
    const token = authHeader?.replace('Bearer ', '') || authHeader;

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

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
        console.warn('[Organizers API] Error setting auth session:', err.message);
      }
    }

    if (req.method === 'GET') {
      // [2025-01-XX] - Support search parameter for autocomplete
      const { search } = req.query;
      
      let query = supabase
        .from('organizers')
        .select('*');
      
      // If search provided, filter by name (case-insensitive)
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.ilike('name', searchTerm);
      }
      
      query = query.order('name', { ascending: true }).limit(50); // Limit results for autocomplete
      
      const { data, error } = await query;

      if (error) {
        console.error('[Organizers API] Error fetching organizers:', error);
        return res.status(500).json({
          error: 'Failed to fetch organizers',
          message: error.message
        });
      }

      return res.status(200).json({
        data: data || []
      });
    }

    if (req.method === 'POST') {
      // Create new organizer
      const { name, description, contact, address, image_url, website_url } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Organizer name is required'
        });
      }

      // Get current user for created_by
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('organizers')
        .insert({
          name: name.trim(),
          description: description || null,
          contact: contact || null,
          address: address || null,
          image_url: image_url || null,
          website_url: website_url || null,
          created_by: user?.id || null
        })
        .select()
        .single();

      if (error) {
        console.error('[Organizers API] Error creating organizer:', error);
        return res.status(500).json({
          error: 'Failed to create organizer',
          message: error.message
        });
      }

      return res.status(201).json({
        data: data
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Organizers API] Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}

