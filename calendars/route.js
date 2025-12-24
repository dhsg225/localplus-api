// [2025-01-23] API endpoint for managing calendars (inspired by EventON's calendar system)
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE || null;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-token, x-supabase-token, x-original-authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Use service role key for reading calendars (public data)
  const supabase = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk');

  if (req.method === 'GET') {
    try {
      const { search } = req.query;
      
      let query = supabase
        .from('calendars')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Calendars API] Error fetching calendars:', error);
        return res.status(500).json({ error: 'Failed to fetch calendars', details: error.message });
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    } catch (error) {
      console.error('[Calendars API] Unexpected error:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  if (req.method === 'POST') {
    // TODO: Add authentication and authorization for creating calendars
    try {
      const { name, slug, description, color } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      const { data, error } = await supabase
        .from('calendars')
        .insert({
          name,
          slug,
          description,
          color,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('[Calendars API] Error creating calendar:', error);
        return res.status(500).json({ error: 'Failed to create calendar', details: error.message });
      }

      return res.status(201).json({
        success: true,
        data
      });
    } catch (error) {
      console.error('[Calendars API] Unexpected error:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

