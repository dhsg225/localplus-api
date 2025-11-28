// [2024-09-26] - Restaurant search endpoint
// [2025-10-01] - Converted to Vercel serverless function format
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/restaurants/search - Search restaurants
  if (req.method === 'GET') {
    try {
      const { query, location, radius = '5000', limit = '20' } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      // Search restaurants by name, cuisine, or description
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .or(`name.ilike.%${query}%,cuisine_type.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(parseInt(limit));

      if (error) {
        console.error('Error searching restaurants:', error);
        return res.status(500).json({ error: 'Failed to search restaurants' });
      }

      return res.status(200).json({
        success: true,
        data: restaurants || [],
        search: {
          query,
          location,
          radius: parseInt(radius)
        }
      });

    } catch (error) {
      console.error('Restaurant search error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
