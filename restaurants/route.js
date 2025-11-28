// [2024-09-26] - Restaurants API for Consumer app
// [2025-10-01] - Converted to Vercel serverless function format
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET /api/restaurants - Get restaurants with filters
  if (req.method === 'GET') {
    try {
      const { location, cuisine, priceRange, rating, limit = '20', offset = '0' } = req.query;

      let query = supabase
        .from('restaurants')
        .select('*')
        .eq('is_active', true)
        .order('name')
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (cuisine) {
        query = query.eq('cuisine_type', cuisine);
      }

      if (priceRange) {
        query = query.eq('price_level', priceRange);
      }

      if (rating) {
        query = query.gte('rating', parseFloat(rating));
      }

      const { data: restaurants, error } = await query;

      if (error) {
        console.error('Error fetching restaurants:', error);
        return res.status(500).json({ error: 'Failed to fetch restaurants' });
      }

      return res.status(200).json({
        success: true,
        data: restaurants || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: restaurants?.length || 0
        }
      });

    } catch (error) {
      console.error('Restaurants GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/restaurants - Create new restaurant
  if (req.method === 'POST') {
    try {
      const restaurantData = req.body;
      
      const { data: restaurant, error } = await supabase
        .from('restaurants')
        .insert([restaurantData])
        .select()
        .single();

      if (error) {
        console.error('Error creating restaurant:', error);
        return res.status(500).json({ error: 'Failed to create restaurant' });
      }

      return res.status(201).json({
        success: true,
        data: restaurant
      });

    } catch (error) {
      console.error('Restaurants POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
