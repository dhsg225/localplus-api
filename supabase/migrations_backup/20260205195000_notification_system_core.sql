-- Migration: Notification System Core Architecture
-- Purpose: Implement the "Resilient Notification Engine" with Transactional Outbox,
--          Partner Preferences, and Mobile App support.
-- Date: 2026-02-05

-- 1. ENHANCED BOOKINGS (Prepare for Super App integration)
-- We need to know where bookings come from and how to contact the customer via app.
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web_widget', -- 'super_app', 'web_widget', 'manual_entry'
ADD COLUMN IF NOT EXISTS external_reference_id TEXT,         -- For Super App transaction IDs
ADD COLUMN IF NOT EXISTS customer_device_token TEXT;         -- To notify consumer when status changes

CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(source);

-- 2. PARTNER PREFERENCES (The "Brain" of the Notification Engine)
-- Stores how and when each restaurant wants to be notified.
CREATE TABLE IF NOT EXISTS partner_preferences (
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Channel Config
    preferred_channel TEXT DEFAULT 'LINE', -- 'LINE', 'WHATSAPP', 'APP_PUSH'
    line_user_id TEXT,                     -- Linked LINE OA User ID (from LINE Login)
    whatsapp_phone_number TEXT,
    
    -- "Smart" Rules
    enable_daily_summary BOOLEAN DEFAULT true,
    summary_send_time TIME DEFAULT '10:00:00',
    summary_frequency TEXT DEFAULT 'DAILY', -- 'DAILY', 'TWICE_DAILY', 'WEEKLY'
    
    -- App Specific
    push_notifications_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_partner_preferences_updated_at
    BEFORE UPDATE ON partner_preferences
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE partner_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Partners can view/edit their own preferences
CREATE POLICY "Partners can view own preferences"
    ON partner_preferences FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM partners
            WHERE partners.business_id = partner_preferences.business_id
            AND partners.user_id = auth.uid()
        )
    );

CREATE POLICY "Partners can update own preferences"
    ON partner_preferences FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM partners
            WHERE partners.business_id = partner_preferences.business_id
            AND partners.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM partners
            WHERE partners.business_id = partner_preferences.business_id
            AND partners.user_id = auth.uid()
        )
    );


-- 3. DEVICE TOKENS (Infrastructure for the "Partner App")
-- Stores FCM/APNS tokens for sending native push notifications.
CREATE TABLE IF NOT EXISTS partner_device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT, -- 'ios', 'android', 'web'
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE partner_device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own device tokens"
    ON partner_device_tokens FOR ALL
    USING (auth.uid() = user_id);


-- 4. THE RESILIENT OUTBOX (Notification Queue)
-- Implements the Transactional Outbox pattern.
-- Edge Functions will poll this (or be triggered) to process notifications.

-- Re-using standard types if possible, but defining enums for clarity
DO $$ BEGIN
    CREATE TYPE notification_channel AS ENUM ('LINE', 'WHATSAPP', 'EMAIL', 'SMS', 'PUSH_PARTNER', 'PUSH_CONSUMER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_status AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- Keep log even if booking deleted? Maybe. Set null for safer constraints.
    recipient_type TEXT, -- 'PARTNER', 'CUSTOMER'
    
    channel notification_channel NOT NULL,
    priority TEXT DEFAULT 'NORMAL', -- 'HIGH' (New Booking), 'LOW' (Summary)
    
    -- Payload for the "Headless" Router
    -- Contains the rendered text, template variables, or specific instructions
    payload JSONB NOT NULL, 
    
    status notification_status DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    next_retry_at TIMESTAMPTZ DEFAULT NOW(),
    
    error_log TEXT, -- Capture API response on failure
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Index for the worker to find pending jobs quickly
CREATE INDEX IF NOT EXISTS idx_queue_pending ON notification_queue(status, next_retry_at) 
WHERE status = 'PENDING';

-- Enable RLS (Admin/Service Role only)
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Only service role can access queue generally, but we might allow some visibility
-- For now, restrictive policy.
CREATE POLICY "Service role manages queue"
    ON notification_queue FOR ALL
    USING ( auth.role() = 'service_role' );

-- 5. Comments for Documentation
COMMENT ON TABLE partner_preferences IS 'Stores notification settings per restaurant (channel, frequency, timing).';
COMMENT ON TABLE partner_device_tokens IS 'Stores FCM/APNS tokens for the upcoming Partner App.';
COMMENT ON TABLE notification_queue IS 'Transactional Outbox for all system notifications to ensure resilience.';
COMMENT ON COLUMN bookings.source IS 'Tracks origin of booking (e.g. Super App vs Web Widget).';
