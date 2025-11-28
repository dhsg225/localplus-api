// [2024-09-26] - Businesses API for Admin app
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

  // GET /api/businesses - Get businesses for admin
  if (req.method === 'GET') {
    try {
      const { status, limit = '50', offset = '0' } = req.query;

      let query = supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (status) {
        query = query.eq('partnership_status', status);
      }

      const { data: businesses, error } = await query;

      if (error) {
        console.error('Error fetching businesses:', error);
        return res.status(500).json({ error: 'Failed to fetch businesses' });
      }

      return res.status(200).json({
        success: true,
        data: businesses || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: businesses?.length || 0
        }
      });

    } catch (error) {
      console.error('Businesses GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/businesses - Create new business
  if (req.method === 'POST') {
    try {
      const businessData = req.body;
      
      const { data: business, error } = await supabase
        .from('businesses')
        .insert([businessData])
        .select()
        .single();

      if (error) {
        console.error('Error creating business:', error);
        return res.status(500).json({ error: 'Failed to create business' });
      }

      return res.status(201).json({
        success: true,
        data: business
      });

    } catch (error) {
      console.error('Businesses POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
