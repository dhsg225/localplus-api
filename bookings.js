// [2024-12-19 10:27] - Core booking API endpoints for Phase 1
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, query, body } = req;
    const { businessId, bookingId, confirmationCode } = query;

    switch (method) {
      case 'GET':
        if (confirmationCode) {
          // Get booking by confirmation code
          const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('confirmation_code', confirmationCode)
            .single();

          if (error) throw error;
          return res.status(200).json({ success: true, data: booking });
        }

        if (bookingId) {
          // Get specific booking
          const { data: booking, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', bookingId)
            .single();

          if (error) throw error;
          return res.status(200).json({ success: true, data: booking });
        }

        if (businessId) {
          // Get bookings for a business
          const { status, startDate, endDate } = query;
          let dbQuery = supabase
            .from('bookings')
            .select('*')
            .eq('business_id', businessId)
            .order('booking_date', { ascending: true })
            .order('booking_time', { ascending: true });

          if (status) {
            dbQuery = dbQuery.eq('status', status);
          }

          if (startDate) {
            dbQuery = dbQuery.gte('booking_date', startDate);
          }

          if (endDate) {
            dbQuery = dbQuery.lte('booking_date', endDate);
          }

          const { data: bookings, error } = await dbQuery;
          if (error) throw error;
          return res.status(200).json({ success: true, data: bookings });
        }

        return res.status(400).json({ success: false, error: 'Missing required parameters' });

      case 'POST':
        if (bookingId) {
          // Update booking status (confirm, cancel, etc.)
          const { action, reason, cancelledBy } = body;
          let updateData = {};

          switch (action) {
            case 'confirm':
              updateData = { status: 'confirmed' };
              break;
            case 'cancel':
              updateData = {
                status: 'cancelled',
                cancellation_reason: reason,
                cancelled_by: cancelledBy,
                cancelled_at: new Date().toISOString()
              };
              break;
            case 'seat':
              updateData = {
                status: 'seated',
                seated_at: new Date().toISOString()
              };
              break;
            case 'complete':
              updateData = {
                status: 'completed',
                completed_at: new Date().toISOString()
              };
              break;
            case 'no_show':
              updateData = { status: 'no_show' };
              break;
            default:
              return res.status(400).json({ success: false, error: 'Invalid action' });
          }

          const { data: booking, error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', bookingId)
            .select()
            .single();

          if (error) throw error;
          return res.status(200).json({ success: true, data: booking });
        }

        // Create new booking
        const {
          business_id,
          customer_name,
          customer_email,
          customer_phone,
          party_size,
          booking_date,
          booking_time,
          special_requests
        } = body;

        // Validate required fields
        if (!business_id || !customer_name || !customer_email || !customer_phone || !party_size || !booking_date || !booking_time) {
          return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields' 
          });
        }

        // Check availability
        const { data: isAvailable, error: availabilityError } = await supabase
          .rpc('check_booking_availability', {
            p_business_id: business_id,
            p_booking_date: booking_date,
            p_booking_time: booking_time,
            p_party_size: party_size
          });

        if (availabilityError) throw availabilityError;

        if (!isAvailable) {
          return res.status(409).json({ 
            success: false, 
            error: 'Time slot not available' 
          });
        }

        // Generate confirmation code
        const { data: confirmationResult } = await supabase
          .rpc('generate_booking_confirmation_code');

        const bookingData = {
          business_id,
          customer_name,
          customer_email,
          customer_phone,
          party_size,
          booking_date,
          booking_time,
          special_requests,
          confirmation_code: confirmationResult,
          status: 'pending'
        };

        const { data: newBooking, error: createError } = await supabase
          .from('bookings')
          .insert([bookingData])
          .select()
          .single();

        if (createError) throw createError;
        return res.status(201).json({ success: true, data: newBooking });

      case 'PUT':
        if (!bookingId) {
          return res.status(400).json({ success: false, error: 'Booking ID required' });
        }

        const { data: updatedBooking, error: updateError } = await supabase
          .from('bookings')
          .update(body)
          .eq('id', bookingId)
          .select()
          .single();

        if (updateError) throw updateError;
        return res.status(200).json({ success: true, data: updatedBooking });

      case 'DELETE':
        if (!bookingId) {
          return res.status(400).json({ success: false, error: 'Booking ID required' });
        }

        const { error: deleteError } = await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);

        if (deleteError) throw deleteError;
        return res.status(200).json({ success: true, message: 'Booking deleted' });

      default:
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Booking API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
} 