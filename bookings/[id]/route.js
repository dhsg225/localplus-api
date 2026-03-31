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
  
  // [2025-11-29] - Check if this is a confirm or cancel action
  // Vercel rewrites /api/bookings/:id/confirm and /api/bookings/:id/cancel to this file
  // We detect this by checking the original URL from headers or request path
  const originalUrl = req.headers['x-vercel-original-url'] || req.url || '';
  const isConfirm = originalUrl.includes('/confirm') || req.url?.includes('/confirm');
  const isCancel = originalUrl.includes('/cancel') || req.url?.includes('/cancel');

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

  // PUT /api/bookings/[id]/confirm - Confirm booking
  if (req.method === 'PUT' && isConfirm) {
    try {
      // [2025-11-26] - Fixed: Only update status (removed restaurant_id and confirmed_at which don't exist in schema)
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error confirming booking:', error);
        return res.status(500).json({ error: 'Failed to confirm booking', details: error.message });
      }

      return res.status(200).json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Booking confirm error:', error);
      return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }

  // PUT /api/bookings/[id]/cancel - Cancel booking
  if (req.method === 'PUT' && isCancel) {
    try {
      const { reason } = req.body;
      
      const { data: booking, error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || 'Cancelled by restaurant',
          cancelled_by: 'restaurant',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling booking:', error);
        return res.status(500).json({ error: 'Failed to cancel booking' });
      }

      return res.status(200).json({
        success: true,
        data: booking
      });

    } catch (error) {
      console.error('Booking cancel error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // PUT /api/bookings/[id] - Update booking (general update)
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
