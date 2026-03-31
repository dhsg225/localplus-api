-- Migration: Notification Triggers
-- Purpose: Automate the insertion of notification jobs into the queue whenever
--          a booking is created or updated.
-- Date: 2026-02-05

-- 1. Function to Queue New Booking Notification
CREATE OR REPLACE FUNCTION queue_new_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_pref RECORD;
    v_payload JSONB;
    v_priority TEXT := 'HIGH';
    v_target_channel notification_channel;
BEGIN
    -- 1. Fetch Partner Preferences
    SELECT * INTO v_pref FROM partner_preferences WHERE business_id = NEW.business_id;

    -- Determine Channel (Logic: Use Preference > Default to LINE)
    IF v_pref.preferred_channel IS NOT NULL THEN
        -- Safely cast, assuming app enforces correct values or we catch error. 
        -- Fallback to LINE if casting fails or is weird could be added here, 
        -- but for now we trust the text match to enum.
        BEGIN
            v_target_channel := v_pref.preferred_channel::notification_channel;
        EXCEPTION WHEN OTHERS THEN
            v_target_channel := 'LINE'; -- Fallback
        END;
    ELSE
        v_target_channel := 'LINE';
    END IF;

    -- 2. Construct Payload
    -- We store essential data so the worker can process it without strictly needing a re-fetch,
    -- though re-fetching is safer for data freshness.
    v_payload := jsonb_build_object(
        'type', 'NEW_BOOKING',
        'event', 'created',
        'booking_id', NEW.id,
        'business_id', NEW.business_id,
        'customer_name', NEW.customer_name,
        'party_size', NEW.party_size,
        'booking_date', NEW.booking_date,
        'booking_time', NEW.booking_time
    );

    -- 3. Insert into Queue (Partner Notification)
    -- We only notify partner if status is 'pending' or 'confirmed' (usually pending for new ones)
    IF NEW.status IN ('pending', 'confirmed') THEN
        INSERT INTO notification_queue (
            booking_id,
            recipient_type,
            channel,
            priority,
            payload,
            status
        ) VALUES (
            NEW.id,
            'PARTNER',
            v_target_channel,
            v_priority,
            v_payload,
            'PENDING'
        );
    END IF;
    
    -- 4. Check for Consumer Push (if token exists)
    -- Notify customer that their booking is received/pending
    IF NEW.customer_device_token IS NOT NULL THEN
        INSERT INTO notification_queue (
            booking_id,
            recipient_type,
            channel,
            priority,
            payload,
            status
        ) VALUES (
            NEW.id,
            'CUSTOMER',
            'PUSH_CONSUMER',
            'HIGH',
            jsonb_build_object(
                'type', 'BOOKING_RECEIVED',
                'status', NEW.status,
                'booking_id', NEW.id
            ),
            'PENDING'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger Attachment
DROP TRIGGER IF EXISTS trigger_new_booking_notification ON bookings;

CREATE TRIGGER trigger_new_booking_notification
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION queue_new_booking_notification();


-- 3. Function to Queue Status Change Notification (e.g. Confirmations)
CREATE OR REPLACE FUNCTION queue_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger if status changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        
        -- Notify Customer via Push if they have a token
        IF NEW.customer_device_token IS NOT NULL THEN
            INSERT INTO notification_queue (
                booking_id,
                recipient_type,
                channel,
                priority,
                payload,
                status
            ) VALUES (
                NEW.id,
                'CUSTOMER',
                'PUSH_CONSUMER',
                'HIGH',
                jsonb_build_object(
                    'type', 'STATUS_CHANGE',
                    'new_status', NEW.status,
                    'previous_status', OLD.status
                ),
                'PENDING'
            );
        END IF;

        -- Notify Partner if status changes to CANCELLED (High Priority)
        IF NEW.status = 'cancelled' THEN
             INSERT INTO notification_queue (
                booking_id,
                recipient_type,
                channel,
                priority,
                payload,
                status
            ) VALUES (
                NEW.id,
                'PARTNER',
                'LINE', -- Default to LINE for cancellations as it's urgent
                'HIGH',
                jsonb_build_object(
                    'type', 'BOOKING_CANCELLED',
                    'reason', NEW.cancellation_reason
                ),
                'PENDING'
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger Attachment for Updates
DROP TRIGGER IF EXISTS trigger_booking_status_change ON bookings;

CREATE TRIGGER trigger_booking_status_change
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION queue_booking_status_change();
