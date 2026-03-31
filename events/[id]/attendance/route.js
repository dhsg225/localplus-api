// [2026-01-21] - Event Attendance Management API
// Handles RSVP submissions, attendance tracking, and payment status updates
const { createClient } = require('@supabase/supabase-js');
const { getAuthenticatedUser, authorizeRequest } = require('../../utils/rbac');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva25wcmFoaHFkaHZkaHptdXdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NTI3MTAsImV4cCI6MjA2NTIyODcxMH0.YYkEkYFWgd_4-OtgG47xj6b5MX_fu7zNQxrW9ymR8Xk';

// Create supabase client with user's auth token for RLS policies
async function getSupabaseClient(authToken = null) {
    const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });

    if (authToken) {
        try {
            const { data: { user }, error } = await client.auth.getUser(authToken);
            if (user && !error) {
                await client.auth.setSession({
                    access_token: authToken,
                    refresh_token: authToken
                });
            }
        } catch (err) {
            console.warn('[API] Error setting auth session:', err.message);
        }
    }

    return client;
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const eventId = req.query.id;

    if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
    }

    // GET /api/events/[id]/attendance - List attendance for an event
    if (req.method === 'GET') {
        try {
            const authHeader = req.headers.authorization;
            const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
            const supabaseClient = await getSupabaseClient(authToken);

            // Check if user can view attendance (event owner/partner or superuser)
            const { authorized } = await authorizeRequest(req, eventId, 'view');

            if (!authorized) {
                return res.status(403).json({ error: 'Insufficient permissions to view attendance' });
            }

            const { data: attendance, error } = await supabaseClient
                .from('event_attendance')
                .select('*')
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching attendance:', error);
                return res.status(500).json({ error: 'Failed to fetch attendance' });
            }

            return res.status(200).json({
                success: true,
                data: attendance || []
            });

        } catch (error) {
            console.error('Attendance GET error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /api/events/[id]/attendance - Submit RSVP
    if (req.method === 'POST') {
        try {
            const authHeader = req.headers.authorization;
            const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
            const supabaseClient = await getSupabaseClient(authToken);

            const { user } = await getAuthenticatedUser(authHeader);
            const attendanceData = req.body;

            // Validate required fields
            if (!attendanceData.guest_name || !attendanceData.guest_email) {
                return res.status(400).json({
                    error: 'Guest name and email are required'
                });
            }

            // Check if event exists and is published
            const { data: event, error: eventError } = await supabaseClient
                .from('events')
                .select('id, status, max_capacity, requires_payment, rsvp_deadline')
                .eq('id', eventId)
                .single();

            if (eventError || !event) {
                return res.status(404).json({ error: 'Event not found' });
            }

            if (event.status !== 'published') {
                return res.status(400).json({ error: 'Event is not open for registration' });
            }

            // Check RSVP deadline
            if (event.rsvp_deadline && new Date(event.rsvp_deadline) < new Date()) {
                return res.status(400).json({ error: 'RSVP deadline has passed' });
            }

            // Check capacity if max_capacity is set
            if (event.max_capacity) {
                const { count } = await supabaseClient
                    .from('event_attendance')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', eventId)
                    .eq('status', 'CONFIRMED');

                const seatsRequested = attendanceData.seats_reserved || 1;

                if (count + seatsRequested > event.max_capacity) {
                    return res.status(400).json({ error: 'Event is at capacity' });
                }
            }

            // Determine initial status based on payment requirement
            let initialStatus = 'RSVP_SUBMITTED';
            let paymentStatus = 'NOT_REQUIRED';

            if (event.requires_payment) {
                initialStatus = 'AWAITING_CONFIRMATION';
                paymentStatus = 'PENDING';
            }

            // Create attendance record
            const newAttendance = {
                event_id: eventId,
                user_id: user?.id || null,
                guest_name: attendanceData.guest_name,
                guest_email: attendanceData.guest_email,
                seats_reserved: attendanceData.seats_reserved || 1,
                status: initialStatus,
                payment_status: paymentStatus,
                payment_proof_url: attendanceData.payment_proof_url || null,
                metadata: attendanceData.metadata || {}
            };

            const { data: attendance, error } = await supabaseClient
                .from('event_attendance')
                .insert([newAttendance])
                .select()
                .single();

            if (error) {
                console.error('Error creating attendance:', error);
                return res.status(500).json({ error: 'Failed to submit RSVP' });
            }

            return res.status(201).json({
                success: true,
                data: attendance
            });

        } catch (error) {
            console.error('Attendance POST error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // PUT /api/events/[id]/attendance - Update attendance status
    if (req.method === 'PUT') {
        try {
            const authHeader = req.headers.authorization;
            const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
            const supabaseClient = await getSupabaseClient(authToken);

            const { user } = await getAuthenticatedUser(authHeader);
            const { attendanceId, status, payment_status, payment_proof_url } = req.body;

            if (!attendanceId) {
                return res.status(400).json({ error: 'attendanceId is required' });
            }

            // Get attendance record
            const { data: attendance } = await supabaseClient
                .from('event_attendance')
                .select('user_id, event_id')
                .eq('id', attendanceId)
                .single();

            if (!attendance) {
                return res.status(404).json({ error: 'Attendance record not found' });
            }

            // Check permissions
            const isOwnAttendance = user && attendance.user_id === user.id;
            const { authorized } = await authorizeRequest(req, attendance.event_id, 'manage_participants');

            if (!isOwnAttendance && !authorized) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            // Build update data
            const updateData = {};

            // Only event owners/partners can update payment status and confirm attendance
            if (authorized) {
                if (status) updateData.status = status;
                if (payment_status) updateData.payment_status = payment_status;
                if (payment_proof_url !== undefined) updateData.payment_proof_url = payment_proof_url;

                // Auto-confirm if payment is received
                if (payment_status === 'RECEIVED' && !status) {
                    updateData.status = 'CONFIRMED';
                }
            } else if (isOwnAttendance) {
                // Users can only cancel their own attendance
                if (status === 'CANCELLED') {
                    updateData.status = 'CANCELLED';
                } else {
                    return res.status(403).json({ error: 'You can only cancel your own attendance' });
                }
            }

            const { data: updatedAttendance, error } = await supabaseClient
                .from('event_attendance')
                .update(updateData)
                .eq('id', attendanceId)
                .select()
                .single();

            if (error) {
                console.error('Error updating attendance:', error);
                return res.status(500).json({ error: 'Failed to update attendance' });
            }

            return res.status(200).json({
                success: true,
                data: updatedAttendance
            });

        } catch (error) {
            console.error('Attendance PUT error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // DELETE /api/events/[id]/attendance - Cancel attendance
    if (req.method === 'DELETE') {
        try {
            const authHeader = req.headers.authorization;
            const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
            const supabaseClient = await getSupabaseClient(authToken);

            const { user } = await getAuthenticatedUser(authHeader);
            const { attendanceId } = req.query;

            if (!attendanceId) {
                return res.status(400).json({ error: 'attendanceId is required' });
            }

            // Get attendance record
            const { data: attendance } = await supabaseClient
                .from('event_attendance')
                .select('user_id, event_id')
                .eq('id', attendanceId)
                .single();

            if (!attendance) {
                return res.status(404).json({ error: 'Attendance record not found' });
            }

            // Check permissions
            const isOwnAttendance = user && attendance.user_id === user.id;
            const { authorized } = await authorizeRequest(req, attendance.event_id, 'manage_participants');

            if (!isOwnAttendance && !authorized) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { error } = await supabaseClient
                .from('event_attendance')
                .delete()
                .eq('id', attendanceId);

            if (error) {
                console.error('Error deleting attendance:', error);
                return res.status(500).json({ error: 'Failed to cancel attendance' });
            }

            return res.status(200).json({
                success: true,
                message: 'Attendance canceled successfully'
            });

        } catch (error) {
            console.error('Attendance DELETE error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
};
