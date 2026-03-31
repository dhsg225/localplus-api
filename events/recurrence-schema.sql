-- [2025-12-05] - Recurrence Rules Schema
-- Based on iCal RRULE specification, inspired by EventON but cleaner
-- Events system specification: API-First architecture with Supabase

-- Recurrence Rules Table
-- Stores iCal-style recurrence rules for events
-- Occurrences are NOT stored - they are generated on-the-fly when queried
CREATE TABLE IF NOT EXISTS recurrence_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  
  -- Frequency: daily, weekly, monthly, yearly
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  
  -- Interval: every X units (e.g., every 2 weeks, every 3 months)
  interval INTEGER NOT NULL DEFAULT 1 CHECK (interval > 0),
  
  -- Weekly: array of weekday integers (0=Sunday, 1=Monday, ..., 6=Saturday)
  -- Example: [1, 3, 5] = Monday, Wednesday, Friday
  byweekday INTEGER[] DEFAULT NULL,
  
  -- Monthly: day of month (1-31)
  -- Used for "On day 15" type rules
  bymonthday INTEGER DEFAULT NULL CHECK (bymonthday IS NULL OR (bymonthday >= 1 AND bymonthday <= 31)),
  
  -- Monthly: weekday position rule
  -- bysetpos: 1=first, 2=second, 3=third, 4=fourth, -1=last
  -- Used with byweekday for "1st Monday", "Last Friday" type rules
  bysetpos INTEGER DEFAULT NULL CHECK (bysetpos IS NULL OR (bysetpos >= -1 AND bysetpos <= 4)),
  
  -- End Conditions
  -- UNTIL: end date (timestamp) - null means no end date
  until TIMESTAMPTZ DEFAULT NULL,
  
  -- COUNT: number of occurrences - null means no count limit
  count INTEGER DEFAULT NULL CHECK (count IS NULL OR count > 0),
  
  -- Exceptions: array of dates to skip (ISO date strings: YYYY-MM-DD)
  -- Example: ['2025-12-25', '2026-01-01'] to skip Christmas and New Year
  exceptions DATE[] DEFAULT '{}',
  
  -- Additional Dates: array of extra occurrences to include (ISO date strings: YYYY-MM-DD)
  -- Example: ['2025-12-31'] to add an extra event on New Year's Eve
  additional_dates DATE[] DEFAULT '{}',
  
  -- Timezone for recurrence calculations (e.g., 'Asia/Bangkok')
  -- Should match the event's timezone_id
  timezone TEXT NOT NULL DEFAULT 'UTC',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_weekly_rule CHECK (
    frequency != 'weekly' OR byweekday IS NOT NULL
  ),
  CONSTRAINT valid_monthly_rule CHECK (
    frequency != 'monthly' OR bymonthday IS NOT NULL OR (bysetpos IS NOT NULL AND byweekday IS NOT NULL)
  ),
  CONSTRAINT valid_end_condition CHECK (
    until IS NULL OR count IS NULL
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_event_id ON recurrence_rules(event_id);
CREATE INDEX IF NOT EXISTS idx_recurrence_rules_frequency ON recurrence_rules(frequency);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recurrence_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_recurrence_rules_updated_at
  BEFORE UPDATE ON recurrence_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_recurrence_rules_updated_at();

-- Migration: Move existing recurrence data from events table to recurrence_rules
-- This is a one-time migration for existing events with recurrence_pattern
DO $$
DECLARE
  event_record RECORD;
  pattern JSONB;
  freq TEXT;
  interval_val INTEGER;
  byweekday_val INTEGER[];
  bymonthday_val INTEGER;
  bysetpos_val INTEGER;
  until_val TIMESTAMPTZ;
  count_val INTEGER;
  exceptions_val DATE[];
  additional_dates_val DATE[];
  tz TEXT;
BEGIN
  FOR event_record IN 
    SELECT id, recurrence_pattern, recurrence_interval, recurrence_count, timezone_id
    FROM events
    WHERE is_recurring = true
      AND recurrence_pattern IS NOT NULL
  LOOP
    pattern := event_record.recurrence_pattern;
    freq := COALESCE(pattern->>'frequency', event_record.recurrence_interval, 'weekly');
    interval_val := COALESCE((pattern->>'interval')::INTEGER, 1);
    tz := COALESCE(event_record.timezone_id, 'UTC');
    
    -- Parse byweekday if present
    IF pattern->'byweekday' IS NOT NULL THEN
      SELECT array_agg(value::INTEGER)
      INTO byweekday_val
      FROM jsonb_array_elements_text(pattern->'byweekday');
    END IF;
    
    -- Parse bymonthday if present
    IF pattern->>'bymonthday' IS NOT NULL THEN
      bymonthday_val := (pattern->>'bymonthday')::INTEGER;
    END IF;
    
    -- Parse bysetpos if present
    IF pattern->>'bysetpos' IS NOT NULL THEN
      bysetpos_val := (pattern->>'bysetpos')::INTEGER;
    END IF;
    
    -- Parse until if present
    IF pattern->>'until' IS NOT NULL THEN
      until_val := (pattern->>'until')::TIMESTAMPTZ;
    END IF;
    
    -- Use recurrence_count from events table
    count_val := event_record.recurrence_count;
    
    -- Parse exceptions if present
    IF pattern->'exceptions' IS NOT NULL THEN
      SELECT array_agg(value::DATE)
      INTO exceptions_val
      FROM jsonb_array_elements_text(pattern->'exceptions');
    ELSE
      exceptions_val := '{}';
    END IF;
    
    -- Parse additional_dates if present
    IF pattern->'additional_dates' IS NOT NULL THEN
      SELECT array_agg(value::DATE)
      INTO additional_dates_val
      FROM jsonb_array_elements_text(pattern->'additional_dates');
    ELSE
      additional_dates_val := '{}';
    END IF;
    
    -- Insert into recurrence_rules
    INSERT INTO recurrence_rules (
      event_id,
      frequency,
      interval,
      byweekday,
      bymonthday,
      bysetpos,
      until,
      count,
      exceptions,
      additional_dates,
      timezone
    ) VALUES (
      event_record.id,
      freq,
      interval_val,
      byweekday_val,
      bymonthday_val,
      bysetpos_val,
      until_val,
      count_val,
      exceptions_val,
      additional_dates_val,
      tz
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- RLS Policies for recurrence_rules
ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;

-- Users can view recurrence rules for events they can access
CREATE POLICY "Users can view recurrence rules for accessible events"
  ON recurrence_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = recurrence_rules.event_id
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

-- Users can create recurrence rules for events they own
CREATE POLICY "Users can create recurrence rules for their events"
  ON recurrence_rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = recurrence_rules.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Users can update recurrence rules for events they own
CREATE POLICY "Users can update recurrence rules for their events"
  ON recurrence_rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = recurrence_rules.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Users can delete recurrence rules for events they own
CREATE POLICY "Users can delete recurrence rules for their events"
  ON recurrence_rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = recurrence_rules.event_id
      AND events.created_by = auth.uid()
    )
  );

