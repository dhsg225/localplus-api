-- [2025-12-01] - Organizers table for reusable event organizers
-- This allows organizers to be created once and reused across multiple events

CREATE TABLE IF NOT EXISTS organizers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  contact TEXT, -- Phone, email, or other contact info
  address TEXT,
  image_url TEXT,
  website_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching organizers
CREATE INDEX IF NOT EXISTS idx_organizers_name ON organizers(name);
CREATE INDEX IF NOT EXISTS idx_organizers_created_by ON organizers(created_by);

-- RLS Policies
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all organizers
CREATE POLICY "Organizers are viewable by authenticated users"
  ON organizers FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create organizers
CREATE POLICY "Authenticated users can create organizers"
  ON organizers FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own organizers
CREATE POLICY "Users can update their own organizers"
  ON organizers FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own organizers
CREATE POLICY "Users can delete their own organizers"
  ON organizers FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

COMMENT ON TABLE organizers IS 'Reusable event organizers that can be assigned to multiple events';

