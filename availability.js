// [2024-12-19 10:28] - Availability checking API endpoint
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { businessId, date, time, partySize } = req.query;

    // Validate required parameters
    if (!businessId || !date || !time || !partySize) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: businessId, date, time, partySize' 
      });
    }

    // Check if the date is in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (bookingDate < today) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot book for past dates' 
      });
    }

    // Check availability using the database function
    const { data: isAvailable, error } = await supabase
      .rpc('check_booking_availability', {
        p_business_id: businessId,
        p_booking_date: date,
        p_booking_time: time,
        p_party_size: parseInt(partySize)
      });

    if (error) {
      console.error('Availability check error:', error);
      throw error;
    }

    // Get additional context for the response
    const [
      { data: timeSlots, error: timeSlotsError },
      { data: operatingHours, error: hoursError },
      { data: settings, error: settingsError }
    ] = await Promise.all([
      supabase
        .from('time_slots')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('slot_time'),
      supabase
        .from('operating_hours')
        .select('*')
        .eq('business_id', businessId)
        .eq('day_of_week', bookingDate.getDay()),
      supabase
        .from('restaurant_settings')
        .select('*')
        .eq('business_id', businessId)
        .single()
    ]);

    if (timeSlotsError || hoursError) {
      console.error('Error fetching context:', { timeSlotsError, hoursError });
    }

    // Get current bookings for the requested time slot
    const { data: currentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('party_size')
      .eq('business_id', businessId)
      .eq('booking_date', date)
      .eq('booking_time', time)
      .not('status', 'in', '(cancelled,no_show)');

    if (bookingsError) {
      console.error('Error fetching current bookings:', bookingsError);
    }

    const currentCapacity = currentBookings?.reduce((sum, booking) => sum + booking.party_size, 0) || 0;
    const timeSlot = timeSlots?.find(slot => slot.slot_time === time);
    const maxCapacity = timeSlot?.capacity || 50;

    return res.status(200).json({ 
      success: true, 
      data: {
        available: isAvailable,
        requestedPartySize: parseInt(partySize),
        currentCapacity,
        maxCapacity,
        remainingCapacity: maxCapacity - currentCapacity,
        timeSlot: timeSlot || null,
        operatingHours: operatingHours?.[0] || null,
        settings: settings || null
      }
    });

  } catch (error) {
    console.error('Availability API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
} 