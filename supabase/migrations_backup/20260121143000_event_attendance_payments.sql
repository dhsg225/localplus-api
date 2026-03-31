-- Migration: Add modular attendance and payment support to events
-- Purpose: Feature-toggle system for RSVP, Ticketing, and future extensions
-- Design: Event owners decide which features to enable per event

-- 1. Extend existing events table with modular feature system
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS enabled_features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS rsvp_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS ticketing_config JSONB DEFAULT '{}';

-- enabled_features structure:
-- {
--   "rsvp": true/false,           -- Enable RSVP/attendance tracking
--   "ticketing": true/false,      -- Enable ticket sales
--   "waitlist": true/false,       -- Enable waitlist (future)
--   "seating": true/false         -- Enable seat selection (future)
-- }

-- rsvp_config structure (only used if enabled_features.rsvp = true):
-- {
--   "max_capacity": 20,
--   "rsvp_deadline": "2026-01-25T18:00:00Z",
--   "requires_confirmation": true,
--   "allow_guest_plus_one": false
-- }

-- ticketing_config structure (only used if enabled_features.ticketing = true):
-- {
--   "price_per_ticket": 500.00,
--   "currency": "THB",
--   "payment_methods": ["bank_transfer", "promptpay"],
--   "ticket_types": [
--     {"name": "General Admission", "price": 500, "quantity": 20},
--     {"name": "VIP", "price": 800, "quantity": 5}
--   ],
--   "sales_start": "2026-01-15T00:00:00Z",
--   "sales_end": "2026-01-25T18:00:00Z"
-- }

-- 2. Create event_attendance table (New Entity)
CREATE TABLE IF NOT EXISTS event_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Nullable for guest checkouts
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  seats_reserved INTEGER NOT NULL DEFAULT 1,
  
  -- Status Definitions: RSVP_SUBMITTED, AWAITING_CONFIRMATION, CONFIRMED, CANCELLED, NO_SHOW
  status VARCHAR(50) NOT NULL DEFAULT 'RSVP_SUBMITTED', 
  
  -- Payment Status: NOT_REQUIRED, PENDING, RECEIVED, REJECTED
  payment_status VARCHAR(50) NOT NULL DEFAULT 'NOT_REQUIRED',
  payment_proof_url TEXT, -- Storage URL for bank transfer slips
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_attendance_event_id ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_user_id ON event_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_status ON event_attendance(status);
CREATE INDEX IF NOT EXISTS idx_event_attendance_payment_status ON event_attendance(payment_status);

-- 4. Enable Row Level Security
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- SELECT: Attendees see their own; Owners/Partners see all for their event
CREATE POLICY "Users can view their own attendance or managed event attendance"
  ON event_attendance FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendance.event_id
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

-- INSERT: Anyone can RSVP to a published event
CREATE POLICY "Anyone can RSVP to published events"
  ON event_attendance FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendance.event_id
      AND events.status = 'published'
    )
  );

-- UPDATE: Owners/Partners can update any field (confirmations, payments); Users can only cancel their own
CREATE POLICY "Owners can update all; users can cancel their own"
  ON event_attendance FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_attendance.event_id
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
  )
  WITH CHECK (
    -- If not the owner/partner, can only set status to 'CANCELLED'
    (
      EXISTS (
        SELECT 1 FROM events
        WHERE events.id = event_attendance.event_id
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
    )
    OR (user_id = auth.uid() AND status = 'CANCELLED')
  );

-- 6. Trigger for updated_at
CREATE TRIGGER update_event_attendance_updated_at
  BEFORE UPDATE ON event_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
