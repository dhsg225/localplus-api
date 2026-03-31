-- [2025-12-01] - Locations table for reusable event locations/venues
-- This allows locations to be created once and reused across multiple events

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  map_url TEXT,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching locations
CREATE INDEX IF NOT EXISTS idx_locations_name ON locations(name);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON locations(created_by);

-- RLS Policies
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all locations
CREATE POLICY "Locations are viewable by authenticated users"
  ON locations FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create locations
CREATE POLICY "Authenticated users can create locations"
  ON locations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own locations
CREATE POLICY "Users can update their own locations"
  ON locations FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own locations
CREATE POLICY "Users can delete their own locations"
  ON locations FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

COMMENT ON TABLE locations IS 'Reusable event locations/venues that can be assigned to multiple events';

