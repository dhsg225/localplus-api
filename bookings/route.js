// [2024-09-26] - Bookings API for Partner app
// [2025-10-01] - Converted to Vercel serverless function format
// [2026-07-01] - POST now enforces booking rules server-side (ported from the
//                mobile client) so the API is the authoritative write path:
//                settings/party-size/date-window validation + availability RPC,
//                plus optional user attribution via verified token.
const { createClient } = require('@supabase/supabase-js');
const { verifyUser } = require('../lib/verifyUser');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

const supabase = createClient(supabaseUrl, supabaseKey);

const REQUIRED_FIELDS = [
  'business_id', 'customer_name', 'customer_email',
  'customer_phone', 'party_size', 'booking_date', 'booking_time',
];

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-token, x-supabase-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/bookings?businessId=... - list a business's bookings
  if (req.method === 'GET') {
    try {
      const { businessId, status, limit = '50', offset = '0' } = req.query;
      if (!businessId) return res.status(400).json({ success: false, error: 'businessId is required' });

      let query = supabase
        .from('bookings')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);
      if (status) query = query.eq('status', status);

      const { data: bookings, error } = await query;
      if (error) {
        console.error('Error fetching bookings:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
      }
      return res.status(200).json({
        success: true,
        data: bookings || [],
        pagination: { limit: parseInt(limit), offset: parseInt(offset), total: bookings?.length || 0 },
      });
    } catch (error) {
      console.error('Bookings GET error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  // POST /api/bookings - create a booking (rules enforced here, not on the client)
  if (req.method === 'POST') {
    try {
      const body = req.body || {};

      // 1. Required fields
      const missing = REQUIRED_FIELDS.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');
      if (missing.length) {
        return res.status(400).json({ success: false, error: `Missing required field(s): ${missing.join(', ')}` });
      }

      const partySize = parseInt(body.party_size, 10);
      if (!Number.isInteger(partySize) || partySize < 1) {
        return res.status(400).json({ success: false, error: 'party_size must be a positive integer' });
      }

      // 2. Business booking settings
      const { data: settings, error: settingsError } = await supabase
        .from('restaurant_settings')
        .select('booking_enabled, min_party_size, max_party_size, advance_booking_days')
        .eq('business_id', body.business_id)
        .single();

      // PGRST116 = no settings row; fall back to defaults (parity with mobile)
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error reading restaurant_settings:', settingsError);
        return res.status(500).json({ success: false, error: 'Failed to check restaurant settings' });
      }

      if (settings && settings.booking_enabled === false) {
        return res.status(409).json({ success: false, error: 'This restaurant is not accepting bookings at this time' });
      }

      // 3. Party size within business limits
      const minParty = settings?.min_party_size ?? 1;
      const maxParty = settings?.max_party_size ?? 12;
      if (partySize < minParty || partySize > maxParty) {
        return res.status(400).json({ success: false, error: `Party size must be between ${minParty} and ${maxParty}` });
      }

      // 4. Date window (not past, within advance-booking limit)
      const maxAdvanceDays = settings?.advance_booking_days ?? 30;
      const bookingDate = new Date(body.booking_date);
      if (isNaN(bookingDate.getTime())) {
        return res.status(400).json({ success: false, error: 'Invalid booking_date' });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((bookingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 0) {
        return res.status(400).json({ success: false, error: 'Booking date cannot be in the past' });
      }
      if (daysDiff > maxAdvanceDays) {
        return res.status(400).json({ success: false, error: `Bookings can only be made up to ${maxAdvanceDays} days in advance` });
      }

      // 5. Slot availability (authoritative DB function)
      const { data: available, error: availErr } = await supabase.rpc('check_booking_availability', {
        p_business_id: body.business_id,
        p_booking_date: body.booking_date,
        p_booking_time: body.booking_time,
        p_party_size: partySize,
      });
      if (availErr) {
        console.error('Availability check failed:', availErr);
        return res.status(500).json({ success: false, error: 'Availability check failed' });
      }
      if (!available) {
        return res.status(409).json({ success: false, error: 'This time slot is not available. Please select another date or time.' });
      }

      // 6. Optional user attribution (if a valid token was sent)
      const user = await verifyUser(req, supabase);

      // 7. Insert — only known columns, never blind-insert the raw body
      const insertRow = {
        business_id: body.business_id,
        customer_name: body.customer_name,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        party_size: partySize,
        booking_date: body.booking_date,
        booking_time: body.booking_time,
        special_requests: body.special_requests ?? null,
        status: 'pending',
        source: body.source || 'api',
        ...(user ? { user_id: user.id } : {}),
      };

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([insertRow])
        .select()
        .single();

      if (error) {
        console.error('Error creating booking:', error);
        return res.status(500).json({ success: false, error: 'Failed to create booking' });
      }

      return res.status(201).json({ success: true, data: booking });
    } catch (error) {
      console.error('Bookings POST error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
};
