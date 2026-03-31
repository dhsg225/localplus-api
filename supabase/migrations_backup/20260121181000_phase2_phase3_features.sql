-- Migration: Extend event_attendance for Phase 2 & 3 features
-- Purpose: Add custom forms, waitlist, QR codes, and reminder tracking
-- Date: 2026-01-21

-- 1. Add new columns to event_attendance table
ALTER TABLE event_attendance
ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS waitlist_position INTEGER,
ADD COLUMN IF NOT EXISTS custom_responses JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reminders_sent JSONB DEFAULT '[]';

-- 2. Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_event_attendance_qr_code ON event_attendance(qr_code);
CREATE INDEX IF NOT EXISTS idx_event_attendance_waitlist_position ON event_attendance(waitlist_position);
CREATE INDEX IF NOT EXISTS idx_event_attendance_checked_in_at ON event_attendance(checked_in_at);

-- 3. Add waitlist_config and private_config to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS waitlist_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS private_config JSONB DEFAULT '{}';

-- waitlist_config structure:
-- {
--   "enabled": true,
--   "auto_promote": true,
--   "max_waitlist_size": 50,
--   "notification_template": "A spot has opened up!",
--   "promotion_window_hours": 24
-- }

-- private_config structure:
-- {
--   "invite_only": true,
--   "invite_codes": [
--     {"code": "VIP2026", "max_uses": 10, "used": 3},
--     {"code": "EARLY", "max_uses": 5, "used": 5}
--   ],
--   "guest_list": ["email1@example.com", "email2@example.com"],
--   "message_wall_enabled": true,
--   "visibility": "private"
-- }

-- 4. Create function to generate unique QR codes
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Create trigger to auto-generate QR codes for confirmed attendance
CREATE OR REPLACE FUNCTION auto_generate_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate QR code when status changes to CONFIRMED and qr_code is null
  IF NEW.status = 'CONFIRMED' AND NEW.qr_code IS NULL THEN
    NEW.qr_code := generate_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_qr_code
  BEFORE INSERT OR UPDATE ON event_attendance
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_qr_code();

-- 6. Create function to manage waitlist promotion
CREATE OR REPLACE FUNCTION promote_from_waitlist(p_event_id UUID)
RETURNS TABLE(promoted_id UUID, promoted_name TEXT, promoted_email TEXT) AS $$
DECLARE
  v_max_capacity INTEGER;
  v_confirmed_count INTEGER;
  v_available_spots INTEGER;
  v_record RECORD;
BEGIN
  -- Get event capacity
  SELECT (rsvp_config->>'max_capacity')::INTEGER INTO v_max_capacity
  FROM events WHERE id = p_event_id;

  -- Count confirmed attendees
  SELECT COUNT(*) INTO v_confirmed_count
  FROM event_attendance
  WHERE event_id = p_event_id AND status = 'CONFIRMED';

  -- Calculate available spots
  v_available_spots := v_max_capacity - v_confirmed_count;

  -- If spots available, promote from waitlist
  IF v_available_spots > 0 THEN
    FOR v_record IN
      SELECT id, guest_name, guest_email
      FROM event_attendance
      WHERE event_id = p_event_id 
        AND waitlist_position IS NOT NULL
      ORDER BY waitlist_position ASC
      LIMIT v_available_spots
    LOOP
      -- Promote to confirmed
      UPDATE event_attendance
      SET 
        status = 'CONFIRMED',
        waitlist_position = NULL,
        updated_at = NOW()
      WHERE id = v_record.id;

      -- Return promoted record
      promoted_id := v_record.id;
      promoted_name := v_record.guest_name;
      promoted_email := v_record.guest_email;
      RETURN NEXT;
    END LOOP;

    -- Reorder remaining waitlist
    UPDATE event_attendance
    SET waitlist_position = new_position
    FROM (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_position
      FROM event_attendance
      WHERE event_id = p_event_id AND waitlist_position IS NOT NULL
    ) AS reordered
    WHERE event_attendance.id = reordered.id;
  END IF;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-promote from waitlist when someone cancels
CREATE OR REPLACE FUNCTION auto_promote_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  v_waitlist_config JSONB;
  v_auto_promote BOOLEAN;
BEGIN
  -- Only trigger when status changes to CANCELLED
  IF OLD.status != 'CANCELLED' AND NEW.status = 'CANCELLED' THEN
    -- Get waitlist config
    SELECT waitlist_config INTO v_waitlist_config
    FROM events WHERE id = NEW.event_id;

    v_auto_promote := COALESCE((v_waitlist_config->>'auto_promote')::BOOLEAN, false);

    -- If auto-promote is enabled, promote from waitlist
    IF v_auto_promote THEN
      PERFORM promote_from_waitlist(NEW.event_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_promote_waitlist
  AFTER UPDATE ON event_attendance
  FOR EACH ROW
  EXECUTE FUNCTION auto_promote_waitlist();

-- 8. Create event_messages table for message wall feature
CREATE TABLE IF NOT EXISTS event_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_messages_event_id ON event_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_event_messages_created_at ON event_messages(created_at DESC);

-- Enable RLS
ALTER TABLE event_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_messages
CREATE POLICY "Users can view messages for events they can access"
  ON event_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_messages.event_id
      AND (
        events.status = 'published'
        OR events.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM partners
          WHERE partners.business_id = events.business_id
          AND partners.user_id = auth.uid()
          AND partners.is_active = true
        )
      )
    )
  );

CREATE POLICY "Attendees can post messages"
  ON event_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_attendance
      WHERE event_attendance.event_id = event_messages.event_id
      AND (
        event_attendance.user_id = auth.uid()
        OR event_attendance.guest_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
      AND event_attendance.status IN ('CONFIRMED', 'AWAITING_CONFIRMATION')
    )
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_messages.event_id
      AND (
        events.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM partners
          WHERE partners.business_id = events.business_id
          AND partners.user_id = auth.uid()
          AND partners.is_active = true
        )
      )
    )
  );

-- Trigger for event_messages updated_at
CREATE TRIGGER update_event_messages_updated_at
  BEFORE UPDATE ON event_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Create email_queue table for reminder system
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  attendance_id UUID REFERENCES event_attendance(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  email_type VARCHAR(50) NOT NULL, -- 'confirmation', 'reminder', 'waitlist_promotion', 'cancellation'
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_for ON email_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_event_id ON email_queue(event_id);

-- 10. Add comments for documentation
COMMENT ON COLUMN event_attendance.qr_code IS 'Unique QR code for check-in, auto-generated when status = CONFIRMED';
COMMENT ON COLUMN event_attendance.checked_in_at IS 'Timestamp when attendee was checked in via QR code or manual check-in';
COMMENT ON COLUMN event_attendance.waitlist_position IS 'Position in waitlist, NULL if not on waitlist';
COMMENT ON COLUMN event_attendance.custom_responses IS 'JSON object storing responses to custom RSVP form fields';
COMMENT ON COLUMN event_attendance.reminders_sent IS 'Array of reminder objects with sent_at timestamps';

COMMENT ON TABLE event_messages IS 'Message wall for private events - attendees can communicate';
COMMENT ON TABLE email_queue IS 'Queue for scheduled emails (confirmations, reminders, waitlist notifications)';

COMMENT ON FUNCTION promote_from_waitlist IS 'Promotes attendees from waitlist when spots become available';
COMMENT ON FUNCTION auto_promote_waitlist IS 'Trigger function to auto-promote from waitlist when someone cancels';
COMMENT ON FUNCTION generate_qr_code IS 'Generates unique 12-character alphanumeric QR code';
