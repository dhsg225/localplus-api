// [2024-09-26] - Bookings API for Partner app
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

  // GET /api/bookings - Get bookings for a business
  if (req.method === 'GET') {
    try {
      const { businessId, status, limit = '50', offset = '0' } = req.query;

      if (!businessId) {
        return res.status(400).json({ error: 'businessId is required' });
      }

      let query = supabase
        .from('bookings')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: bookings, error } = await query;

      if (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({ error: 'Failed to fetch bookings' });
      }

      return res.status(200).json({
        success: true,
        data: bookings || [],
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: bookings?.length || 0
        }
      });

    } catch (error) {
      console.error('Bookings GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/bookings - Create new booking
  if (req.method === 'POST') {
    try {
      const bookingData = req.body;
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return res.status(500).json({ error: 'Failed to create booking' });
      }

      return res.status(201).json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Bookings POST error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
