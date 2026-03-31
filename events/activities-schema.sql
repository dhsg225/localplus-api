-- [2025-12-02] - Activities table for tourism activities
-- Activities: tours, water sports, adventure activities, experiences
-- Typically have business entities managing them

CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subtitle TEXT,
  
  -- Business relationship (activities typically have business entities)
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Activity details
  activity_type TEXT, -- 'water_sports', 'adventure', 'tours', 'experiences'
  category TEXT, -- More specific category
  duration_minutes INTEGER, -- Activity duration in minutes
  price DECIMAL(10, 2), -- Base price
  currency TEXT DEFAULT 'THB',
  capacity INTEGER, -- Maximum participants per session
  min_age INTEGER, -- Minimum age requirement
  max_age INTEGER, -- Maximum age requirement
  difficulty_level TEXT, -- 'beginner', 'intermediate', 'advanced', 'expert'
  
  -- Location and venue
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  map_url TEXT,
  
  -- Media
  hero_image_url TEXT,
  image_urls TEXT[] DEFAULT '{}', -- Array of image URLs
  video_url TEXT,
  
  -- Content
  highlights TEXT[], -- Array of highlight features
  includes TEXT[], -- What's included (equipment, guide, etc.)
  excludes TEXT[], -- What's not included
  requirements TEXT[], -- Requirements (swimming ability, fitness level, etc.)
  what_to_bring TEXT[], -- What participants should bring
  
  -- Availability and scheduling
  is_available BOOLEAN DEFAULT true,
  availability_schedule JSONB, -- JSON describing availability (days, times, seasons)
  booking_required BOOLEAN DEFAULT true,
  advance_booking_days INTEGER, -- How many days in advance booking is required
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'suspended', 'archived'
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional flexible data
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_business_id ON activities(business_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_by ON activities(created_by);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_activity_type ON activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_location_id ON activities(location_id);
CREATE INDEX IF NOT EXISTS idx_activities_venue_id ON activities(venue_id);
CREATE INDEX IF NOT EXISTS idx_activities_tags_gin ON activities USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_activities_is_available ON activities(is_available);

-- RLS Policies
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read published activities
CREATE POLICY "Published activities are viewable by authenticated users"
  ON activities FOR SELECT
  TO authenticated
  USING (status = 'published' OR created_by = auth.uid());

-- Allow authenticated users to create activities
CREATE POLICY "Authenticated users can create activities"
  ON activities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own activities
CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own activities
CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Super admins can manage all activities
CREATE POLICY "Super admins can manage all activities"
  ON activities FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
        AND user_roles.is_active = true
    )
  );

COMMENT ON TABLE activities IS 'Tourism activities: tours, water sports, adventure activities, experiences';
COMMENT ON COLUMN activities.activity_type IS 'Type: water_sports, adventure, tours, experiences';
COMMENT ON COLUMN activities.availability_schedule IS 'JSON describing availability (e.g., {"days": ["monday", "tuesday"], "times": ["09:00", "14:00"], "seasons": ["high", "low"]})';

