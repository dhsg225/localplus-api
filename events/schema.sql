-- [2025-01-XX] - Event Engine Phase 0 + Phase 1: Supabase schema for events module
-- Phase 0: Core event tables
-- Phase 1: RBAC and permissions
--
-- Dependencies:
-- - auth.users (Supabase built-in)
-- - Creates minimal businesses and partners tables if they don't exist
--
-- Note: This schema is designed to work on a fresh Supabase instance.
-- The businesses and partners tables are created with minimal structure
-- to support the events module. You can extend these tables later as needed.

-- Create businesses table if it doesn't exist (minimal structure for events module)
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  partnership_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create partners table if it doesn't exist (links users to businesses)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_id UUID NOT NULL, -- References businesses(id) but no FK to allow independent creation
  role VARCHAR(50) DEFAULT 'owner',
  is_active BOOLEAN DEFAULT true,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

-- Create indexes for partners table
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_business_id ON partners(business_id);
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);

-- Events table - Core event data
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  business_id UUID, -- References businesses(id) - table created above
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL DEFAULT 'general', -- general, workshop, meeting, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, published, cancelled, completed
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location VARCHAR(255),
  max_participants INTEGER,
  -- [2025-11-28 23:59] - Optional calendar grouping and tags for discovery
  calendar_id UUID,
  tags TEXT[] DEFAULT '{}',
  -- [2025-11-29 00:10] - EventON-inspired structural fields (renamed for LocalPlus)
  external_event_key TEXT,           -- Source system event identifier
  theme_color_hex TEXT,              -- Preferred UI color for cards
  timezone_id TEXT,                  -- e.g. Asia/Bangkok
  hide_end_time_flag BOOLEAN DEFAULT false,
  is_year_round BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT,          -- daily | weekly | monthly | custom
  recurrence_count INTEGER,
  recurrence_pattern JSONB,          -- JSON describing advanced repeat rules
  venue_area TEXT,                   -- Short area/quarter label
  venue_latitude DOUBLE PRECISION,
  venue_longitude DOUBLE PRECISION,
  venue_map_url TEXT,
  subtitle TEXT,
  hero_image_url TEXT,
  learn_more_url TEXT,
  external_source_url TEXT,
  primary_type_id UUID REFERENCES event_types(id),
  secondary_type_id UUID REFERENCES event_types(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Event calendars - logical groupings (e.g. city calendars, hotel calendars)
CREATE TABLE IF NOT EXISTS event_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Event types - admin-managed catalog of event types
CREATE TABLE IF NOT EXISTS event_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link events to calendars and extended structure if present
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS calendar_id UUID;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS external_event_key TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS theme_color_hex TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS timezone_id TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS hide_end_time_flag BOOLEAN DEFAULT false;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_year_round BOOLEAN DEFAULT false;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS recurrence_interval TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS recurrence_count INTEGER;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS venue_area TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS venue_latitude DOUBLE PRECISION;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS venue_longitude DOUBLE PRECISION;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS venue_map_url TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS subtitle TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS learn_more_url TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS external_source_url TEXT;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS primary_type_id UUID REFERENCES event_types(id);

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS secondary_type_id UUID REFERENCES event_types(id);

-- Event participants table - Track who is attending events
CREATE TABLE IF NOT EXISTS event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'attendee', -- attendee, organizer, speaker, etc.
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, confirmed, cancelled, waitlisted
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(event_id, user_id)
);

-- Event permissions table - RBAC for event access control
CREATE TABLE IF NOT EXISTS event_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID, -- References businesses(id) - table created above
  role VARCHAR(50) NOT NULL, -- owner, editor, viewer, participant
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  CONSTRAINT valid_permission_target CHECK (
    (user_id IS NOT NULL AND business_id IS NULL) OR
    (user_id IS NULL AND business_id IS NOT NULL)
  )
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_business_id ON events(business_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_calendar_id ON events(calendar_id);
CREATE INDEX IF NOT EXISTS idx_events_tags_gin ON events USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_events_primary_type_id ON events(primary_type_id);
CREATE INDEX IF NOT EXISTS idx_events_secondary_type_id ON events(secondary_type_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_event_permissions_event_id ON event_permissions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_permissions_user_id ON event_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_permissions_business_id ON event_permissions(business_id);

-- RLS (Row Level Security) Policies for Phase 1 RBAC
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_permissions ENABLE ROW LEVEL SECURITY;

-- Events RLS Policies
-- [2025-11-28] - Simplified to avoid recursion between events and event_permissions
-- Users can view published events, events they created, or events for their businesses
CREATE POLICY "Users can view published events"
  ON events FOR SELECT
  USING (
    status = 'published'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM partners
      WHERE partners.business_id = events.business_id
        AND partners.user_id = auth.uid()
        AND partners.is_active = true
    )
  );

-- Users can create events if they're linked to a business
CREATE POLICY "Users can create events for their businesses"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM partners 
      WHERE partners.business_id = events.business_id 
      AND partners.user_id = auth.uid()
      AND partners.is_active = true
    ) OR
    created_by = auth.uid()
  );

-- Users can update events they own or events for their businesses
CREATE POLICY "Users can update events they own or have editor access"
  ON events FOR UPDATE
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM partners
      WHERE partners.business_id = events.business_id
        AND partners.user_id = auth.uid()
        AND partners.is_active = true
    )
  );

-- Users can delete events they own
CREATE POLICY "Users can delete events they own"
  ON events FOR DELETE
  USING (created_by = auth.uid());

-- Event Participants RLS Policies
CREATE POLICY "Users can view participants of events they can access"
  ON event_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND (events.status = 'published' OR 
           events.created_by = auth.uid() OR
           EXISTS (
             SELECT 1 FROM event_permissions 
             WHERE event_permissions.event_id = events.id 
             AND event_permissions.user_id = auth.uid()
           ))
    )
  );

CREATE POLICY "Users can register themselves as participants"
  ON event_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_participants.event_id 
      AND events.status = 'published'
    )
  );

CREATE POLICY "Users can update their own participant status"
  ON event_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Event Permissions RLS Policies
CREATE POLICY "Users can view permissions for events they own"
  ON event_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_permissions.event_id 
      AND events.created_by = auth.uid()
    ) OR
    user_id = auth.uid() OR
    business_id IN (
      SELECT business_id FROM partners WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Event owners can grant permissions"
  ON event_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_permissions.event_id 
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Event owners can revoke permissions"
  ON event_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_permissions.event_id 
      AND events.created_by = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

