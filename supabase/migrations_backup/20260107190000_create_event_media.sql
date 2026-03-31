-- [2026-01-07] - Media Library Table
-- Tracks images uploaded to Bunny.net Storage for the Event Media Manager

CREATE TABLE IF NOT EXISTS event_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  bunny_path TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  business_id UUID, -- Optional: links media to a specific business
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  width INTEGER,
  height INTEGER,
  filesize INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_event_media_uploaded_by ON event_media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_event_media_business_id ON event_media(business_id);
CREATE INDEX IF NOT EXISTS idx_event_media_created_at ON event_media(created_at);

-- RLS (Row Level Security)
ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;

-- Users can view media they uploaded or media for their businesses
CREATE POLICY "Users can view their media"
  ON event_media FOR SELECT
  USING (
    uploaded_by = auth.uid()
    OR (
      business_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM partners
        WHERE partners.business_id = event_media.business_id
        AND partners.user_id = auth.uid()
        AND partners.is_active = true
      )
    )
    -- Superusers can view everything
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'events_superuser')
      AND user_roles.is_active = true
    )
  );

-- Users can insert media
CREATE POLICY "Users can insert media"
  ON event_media FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    OR auth.uid() IS NOT NULL
  );

-- Function to update updated_at timestamp
CREATE TRIGGER update_event_media_updated_at
  BEFORE UPDATE ON event_media
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
