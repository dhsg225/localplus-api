-- [2025-12-02] - Venues table for reusable event venues
-- Similar to locations but specifically for venues (may have additional venue-specific fields)

CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  map_url TEXT,
  image_url TEXT,
  venue_type TEXT, -- e.g., 'restaurant', 'hotel', 'beach_club', 'bar', 'resort'
  capacity INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching venues
CREATE INDEX IF NOT EXISTS idx_venues_name ON venues(name);
CREATE INDEX IF NOT EXISTS idx_venues_type ON venues(venue_type);
CREATE INDEX IF NOT EXISTS idx_venues_created_by ON venues(created_by);

-- RLS Policies
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all venues
CREATE POLICY "Venues are viewable by authenticated users"
  ON venues FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create venues
CREATE POLICY "Authenticated users can create venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own venues
CREATE POLICY "Users can update their own venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own venues
CREATE POLICY "Users can delete their own venues"
  ON venues FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

COMMENT ON TABLE venues IS 'Reusable event venues that can be assigned to multiple events';

