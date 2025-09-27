// [2024-12-19 10:30] - Notification API endpoint for sending email/SMS notifications
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
    const { method, body } = req;

    switch (method) {
      case 'POST':
        const { notificationId, action } = body;

        if (action === 'send') {
          // Get notification details
          const { data: notification, error: fetchError } = await supabase
            .from('booking_notifications')
            .select('*')
            .eq('id', notificationId)
            .single();

          if (fetchError) throw fetchError;

          // Update status to sent
          const { data: updatedNotification, error: updateError } = await supabase
            .from('booking_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString()
            })
            .eq('id', notificationId)
            .select()
            .single();

          if (updateError) throw updateError;

          // TODO: Integrate with actual email/SMS service
          // For now, just mark as sent
          console.log(`[NOTIFICATION] Would send ${notification.channel} notification:`, {
            to: notification.recipient_email || notification.recipient_phone,
            subject: notification.subject,
            message: notification.message
          });

          return res.status(200).json({ 
            success: true, 
            data: updatedNotification,
            message: 'Notification marked as sent (email/SMS integration pending)'
          });
        }

        if (action === 'mark_delivered') {
          const { data: updatedNotification, error } = await supabase
            .from('booking_notifications')
            .update({
              status: 'delivered',
              delivered_at: new Date().toISOString()
            })
            .eq('id', notificationId)
            .select()
            .single();

          if (error) throw error;

          return res.status(200).json({ 
            success: true, 
            data: updatedNotification 
          });
        }

        return res.status(400).json({ success: false, error: 'Invalid action' });

      case 'GET':
        const { bookingId, businessId, status } = req.query;

        if (bookingId) {
          // Get notifications for a specific booking
          const { data, error } = await supabase
            .from('booking_notifications')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        }

        if (businessId) {
          // Get notifications for a business
          const { data, error } = await supabase
            .from('booking_notifications')
            .select(`
              *,
              bookings!inner(business_id)
            `)
            .eq('bookings.business_id', businessId)
            .order('created_at', { ascending: false })
            .limit(50);

          if (error) throw error;
          return res.status(200).json({ success: true, data });
        }

        return res.status(400).json({ success: false, error: 'Missing bookingId or businessId' });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ success: false, error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Notification API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
} 