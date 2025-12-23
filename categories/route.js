// [2025-01-XX] - Categories API endpoint (wp_term_mapping)
// GET /api/categories - List all categories with optional search

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Token, X-Supabase-Token, X-Original-Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // [2025-01-XX] - Use service role client to bypass RLS (categories are public)
    const supabaseAdmin = supabaseServiceRoleKey 
      ? createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        })
      : null;

    // Regular client as fallback
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const client = supabaseAdmin || supabase;

    if (req.method === 'GET') {
      // [2025-01-XX] - Support search parameter for autocomplete
      const { search } = req.query;
      
      let query = client
        .from('wp_term_mapping')
        .select('term_id, name, slug')
        .order('name', { ascending: true });
      
      // If search provided, filter by name (case-insensitive)
      if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        query = query.ilike('name', searchTerm);
      }
      
      query = query.limit(50); // Limit results for autocomplete
      
      const { data, error } = await query;

      if (error) {
        console.error('[Categories API] Error fetching categories:', error);
        return res.status(500).json({
          error: 'Failed to fetch categories',
          message: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('[Categories API] Unexpected error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
}

