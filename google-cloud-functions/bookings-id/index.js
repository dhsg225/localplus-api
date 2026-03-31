// [2025-11-29] - Google Cloud Function for Individual Booking Operations
// Migrated from Vercel serverless function
// Handles: GET, PUT, confirm, cancel
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

exports.bookingsId = async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract ID from query params (GCF passes path params as query.id)
  const id = req.query.id || req.body.id;
  
  // [2025-11-29] - Check if this is a confirm or cancel action
  // GCF: Check URL path or query parameter
  const url = req.url || req.originalUrl || '';
  const isConfirm = url.includes('/confirm') || req.query.action === 'confirm';
  const isCancel = url.includes('/cancel') || req.query.action === 'cancel';

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

