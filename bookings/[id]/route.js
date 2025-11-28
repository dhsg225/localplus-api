// [2024-09-26] - Individual booking operations
// [2025-10-01] - Converted to Vercel serverless function format
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract ID from URL path
  const id = req.query.id;

  // GET /api/bookings/[id] - Get specific booking
  if (req.method === 'GET') {
    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Booking not found' });
        }
        console.error('Error fetching booking:', error);
        return res.status(500).json({ error: 'Failed to fetch booking' });
      }

      return res.status(200).json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Booking GET error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /api/bookings/[id] - Update booking
  if (req.method === 'PUT') {
    try {
      const updateData = req.body;
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating booking:', error);
        return res.status(500).json({ error: 'Failed to update booking' });
      }

      return res.status(200).json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Booking PUT error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
