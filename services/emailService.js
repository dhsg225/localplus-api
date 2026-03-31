// [2026-01-21] - Email Notification Service
// Handles RSVP confirmations, reminders, waitlist promotions, and bulk messaging
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://joknprahhqdhvdhzmuwl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Email templates
const EMAIL_TEMPLATES = {
    rsvp_confirmation: {
        subject: (data) => `RSVP Confirmed: ${data.eventTitle}`,
        body: (data) => `
      Hi ${data.guestName},

      Your RSVP for "${data.eventTitle}" has been confirmed!

      Event Details:
      📅 Date: ${new Date(data.eventStartTime).toLocaleString()}
      📍 Location: ${data.eventLocation || 'TBA'}
      🎫 Seats Reserved: ${data.seatsReserved}

      ${data.requiresPayment ? `
      Payment Status: ${data.paymentStatus}
      ${data.paymentStatus === 'PENDING' ? 'Please complete your payment to secure your spot.' : ''}
      ` : ''}

      ${data.qrCode ? `
      Your QR Code: ${data.qrCode}
      Show this code at check-in.
      ` : ''}

      We look forward to seeing you!

      Best regards,
      ${data.organizerName || 'Event Team'}
    `
    },

    rsvp_waitlist: {
        subject: (data) => `Waitlist: ${data.eventTitle}`,
        body: (data) => `
      Hi ${data.guestName},

      Thank you for your interest in "${data.eventTitle}"!

      Unfortunately, the event is currently at full capacity. You've been added to the waitlist at position #${data.waitlistPosition}.

      We'll notify you immediately if a spot opens up.

      Event Details:
      📅 Date: ${new Date(data.eventStartTime).toLocaleString()}
      📍 Location: ${data.eventLocation || 'TBA'}

      Best regards,
      ${data.organizerName || 'Event Team'}
    `
    },

    waitlist_promotion: {
        subject: (data) => `🎉 Spot Available: ${data.eventTitle}`,
        body: (data) => `
      Hi ${data.guestName},

      Great news! A spot has opened up for "${data.eventTitle}"!

      You've been automatically moved from the waitlist to confirmed attendance.

      Event Details:
      📅 Date: ${new Date(data.eventStartTime).toLocaleString()}
      📍 Location: ${data.eventLocation || 'TBA'}
      🎫 Seats Reserved: ${data.seatsReserved}

      ${data.requiresPayment ? `
      ⚠️ Payment Required
      Please complete your payment within 24 hours to secure your spot.
      ` : ''}

      ${data.qrCode ? `
      Your QR Code: ${data.qrCode}
      ` : ''}

      See you there!

      Best regards,
      ${data.organizerName || 'Event Team'}
    `
    },

    reminder: {
        subject: (data) => `Reminder: ${data.eventTitle} ${data.daysUntil ? `in ${data.daysUntil} days` : 'tomorrow'}`,
        body: (data) => `
      Hi ${data.guestName},

      This is a friendly reminder about "${data.eventTitle}"!

      Event Details:
      📅 Date: ${new Date(data.eventStartTime).toLocaleString()}
      📍 Location: ${data.eventLocation || 'TBA'}
      🎫 Your Seats: ${data.seatsReserved}

      ${data.qrCode ? `
      Your QR Code: ${data.qrCode}
      Please have this ready for check-in.
      ` : ''}

      ${data.customMessage || ''}

      Looking forward to seeing you!

      Best regards,
      ${data.organizerName || 'Event Team'}
    `
    },

    cancellation: {
        subject: (data) => `Cancelled: ${data.eventTitle}`,
        body: (data) => `
      Hi ${data.guestName},

      Your RSVP for "${data.eventTitle}" has been cancelled.

      ${data.reason ? `Reason: ${data.reason}` : ''}

      If this was a mistake, please contact us or RSVP again if spots are still available.

      Best regards,
      ${data.organizerName || 'Event Team'}
    `
    },

    host_new_rsvp: {
        subject: (data) => `New RSVP: ${data.guestName} for ${data.eventTitle}`,
        body: (data) => `
      New RSVP received for your event "${data.eventTitle}"!

      Guest Details:
      👤 Name: ${data.guestName}
      📧 Email: ${data.guestEmail}
      🎫 Seats: ${data.seatsReserved}
      📅 RSVP Time: ${new Date(data.rsvpTime).toLocaleString()}

      ${data.requiresPayment ? `
      💰 Payment Status: ${data.paymentStatus}
      ${data.paymentProofUrl ? `Payment Proof: ${data.paymentProofUrl}` : ''}
      ` : ''}

      ${data.customResponses && Object.keys(data.customResponses).length > 0 ? `
      Custom Responses:
      ${Object.entries(data.customResponses).map(([key, value]) => `• ${key}: ${value}`).join('\n')}
      ` : ''}

      Current Status:
      ✅ Confirmed: ${data.confirmedCount}
      ⏳ Pending: ${data.pendingCount}
      📊 Total Seats: ${data.totalSeats} / ${data.maxCapacity || '∞'}

      Manage attendance: ${data.dashboardUrl}
    `
    }
};

class EmailService {
    /**
     * Send RSVP confirmation email
     */
    async sendRSVPConfirmation(attendanceId) {
        try {
            // Get attendance and event details
            const { data: attendance } = await supabase
                .from('event_attendance')
                .select(`
          *,
          event:events(*)
        `)
                .eq('id', attendanceId)
                .single();

            if (!attendance) {
                throw new Error('Attendance record not found');
            }

            const template = attendance.waitlist_position !== null
                ? EMAIL_TEMPLATES.rsvp_waitlist
                : EMAIL_TEMPLATES.rsvp_confirmation;

            const emailData = {
                guestName: attendance.guest_name,
                eventTitle: attendance.event.title,
                eventStartTime: attendance.event.start_time,
                eventLocation: attendance.event.location,
                seatsReserved: attendance.seats_reserved,
                requiresPayment: attendance.event.enabled_features?.ticketing,
                paymentStatus: attendance.payment_status,
                qrCode: attendance.qr_code,
                waitlistPosition: attendance.waitlist_position,
                organizerName: attendance.event.organizer_name
            };

            await this.queueEmail({
                event_id: attendance.event_id,
                attendance_id: attendanceId,
                recipient_email: attendance.guest_email,
                recipient_name: attendance.guest_name,
                email_type: attendance.waitlist_position !== null ? 'waitlist' : 'confirmation',
                subject: template.subject(emailData),
                body: template.body(emailData),
                scheduled_for: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error('Error sending RSVP confirmation:', error);
            throw error;
        }
    }

    /**
     * Send waitlist promotion notification
     */
    async sendWaitlistPromotion(attendanceId) {
        try {
            const { data: attendance } = await supabase
                .from('event_attendance')
                .select(`
          *,
          event:events(*)
        `)
                .eq('id', attendanceId)
                .single();

            const template = EMAIL_TEMPLATES.waitlist_promotion;
            const emailData = {
                guestName: attendance.guest_name,
                eventTitle: attendance.event.title,
                eventStartTime: attendance.event.start_time,
                eventLocation: attendance.event.location,
                seatsReserved: attendance.seats_reserved,
                requiresPayment: attendance.event.enabled_features?.ticketing,
                qrCode: attendance.qr_code,
                organizerName: attendance.event.organizer_name
            };

            await this.queueEmail({
                event_id: attendance.event_id,
                attendance_id: attendanceId,
                recipient_email: attendance.guest_email,
                recipient_name: attendance.guest_name,
                email_type: 'waitlist_promotion',
                subject: template.subject(emailData),
                body: template.body(emailData),
                scheduled_for: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error('Error sending waitlist promotion:', error);
            throw error;
        }
    }

    /**
     * Schedule reminder emails for an event
     */
    async scheduleReminders(eventId) {
        try {
            // Get event with reminder config
            const { data: event } = await supabase
                .from('events')
                .select('*')
                .eq('id', eventId)
                .single();

            if (!event?.rsvp_config?.reminders?.enabled) {
                return { success: false, message: 'Reminders not enabled' };
            }

            const schedules = event.rsvp_config.reminders.schedules || [];
            const customMessage = event.rsvp_config.reminders.custom_message || '';

            // Get confirmed attendees
            const { data: attendees } = await supabase
                .from('event_attendance')
                .select('*')
                .eq('event_id', eventId)
                .eq('status', 'CONFIRMED');

            const eventStartTime = new Date(event.start_time);

            for (const schedule of schedules) {
                let scheduledFor = new Date(eventStartTime);

                if (schedule.days_before) {
                    scheduledFor.setDate(scheduledFor.getDate() - schedule.days_before);
                } else if (schedule.hours_before) {
                    scheduledFor.setHours(scheduledFor.getHours() - schedule.hours_before);
                }

                if (schedule.time) {
                    const [hours, minutes] = schedule.time.split(':');
                    scheduledFor.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                }

                // Only schedule if in the future
                if (scheduledFor > new Date()) {
                    for (const attendee of attendees) {
                        const template = EMAIL_TEMPLATES.reminder;
                        const emailData = {
                            guestName: attendee.guest_name,
                            eventTitle: event.title,
                            eventStartTime: event.start_time,
                            eventLocation: event.location,
                            seatsReserved: attendee.seats_reserved,
                            qrCode: attendee.qr_code,
                            customMessage,
                            daysUntil: schedule.days_before,
                            organizerName: event.organizer_name
                        };

                        await this.queueEmail({
                            event_id: eventId,
                            attendance_id: attendee.id,
                            recipient_email: attendee.guest_email,
                            recipient_name: attendee.guest_name,
                            email_type: 'reminder',
                            subject: template.subject(emailData),
                            body: template.body(emailData),
                            scheduled_for: scheduledFor.toISOString(),
                            metadata: { reminder_type: schedule.days_before ? `${schedule.days_before}_day` : `${schedule.hours_before}_hour` }
                        });
                    }
                }
            }

            return { success: true, scheduled: attendees.length * schedules.length };
        } catch (error) {
            console.error('Error scheduling reminders:', error);
            throw error;
        }
    }

    /**
     * Send notification to host about new RSVP
     */
    async notifyHostNewRSVP(attendanceId) {
        try {
            const { data: attendance } = await supabase
                .from('event_attendance')
                .select(`
          *,
          event:events(*)
        `)
                .eq('id', attendanceId)
                .single();

            // Get event creator email
            const { data: creator } = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', attendance.event.created_by)
                .single();

            if (!creator?.email) return;

            // Get attendance stats
            const { data: stats } = await supabase
                .from('event_attendance')
                .select('status, seats_reserved')
                .eq('event_id', attendance.event_id);

            const confirmedCount = stats.filter(s => s.status === 'CONFIRMED').length;
            const pendingCount = stats.filter(s => s.status === 'AWAITING_CONFIRMATION').length;
            const totalSeats = stats.reduce((sum, s) => sum + s.seats_reserved, 0);

            const template = EMAIL_TEMPLATES.host_new_rsvp;
            const emailData = {
                guestName: attendance.guest_name,
                guestEmail: attendance.guest_email,
                eventTitle: attendance.event.title,
                seatsReserved: attendance.seats_reserved,
                rsvpTime: attendance.created_at,
                requiresPayment: attendance.event.enabled_features?.ticketing,
                paymentStatus: attendance.payment_status,
                paymentProofUrl: attendance.payment_proof_url,
                customResponses: attendance.custom_responses,
                confirmedCount,
                pendingCount,
                totalSeats,
                maxCapacity: attendance.event.rsvp_config?.max_capacity,
                dashboardUrl: `${process.env.PARTNER_APP_URL}/events/${attendance.event_id}/attendance`
            };

            await this.queueEmail({
                event_id: attendance.event_id,
                attendance_id: attendanceId,
                recipient_email: creator.email,
                recipient_name: 'Event Host',
                email_type: 'host_notification',
                subject: template.subject(emailData),
                body: template.body(emailData),
                scheduled_for: new Date().toISOString()
            });

            return { success: true };
        } catch (error) {
            console.error('Error notifying host:', error);
            throw error;
        }
    }

    /**
     * Queue an email for sending
     */
    async queueEmail(emailData) {
        const { error } = await supabase
            .from('email_queue')
            .insert([emailData]);

        if (error) {
            console.error('Error queueing email:', error);
            throw error;
        }

        return { success: true };
    }

    /**
     * Process email queue (called by cron job)
     */
    async processQueue() {
        try {
            // Get pending emails that are due
            const { data: emails } = await supabase
                .from('email_queue')
                .select('*')
                .eq('status', 'pending')
                .lte('scheduled_for', new Date().toISOString())
                .limit(100);

            if (!emails || emails.length === 0) {
                return { processed: 0 };
            }

            let sent = 0;
            let failed = 0;

            for (const email of emails) {
                try {
                    // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
                    // For now, just mark as sent
                    console.log(`[EMAIL] To: ${email.recipient_email}, Subject: ${email.subject}`);

                    await supabase
                        .from('email_queue')
                        .update({
                            status: 'sent',
                            sent_at: new Date().toISOString()
                        })
                        .eq('id', email.id);

                    sent++;
                } catch (error) {
                    await supabase
                        .from('email_queue')
                        .update({
                            status: 'failed',
                            error_message: error.message
                        })
                        .eq('id', email.id);

                    failed++;
                }
            }

            return { processed: emails.length, sent, failed };
        } catch (error) {
            console.error('Error processing email queue:', error);
            throw error;
        }
    }
}

module.exports = new EmailService();
