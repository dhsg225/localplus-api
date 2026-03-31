-- [2025-12-02] - Attractions table for tourist attractions
-- Attractions: beaches, parks, viewpoints, landmarks
-- May NOT have business entities (DMO managed)

CREATE TABLE IF NOT EXISTS attractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  subtitle TEXT,
  
  -- Business relationship (optional - attractions may not have business entities)
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  managed_by_dmo BOOLEAN DEFAULT true, -- Flag to indicate DMO management
  
  -- Attraction details
  attraction_type TEXT NOT NULL, -- 'beach', 'park', 'viewpoint', 'landmark', 'natural', 'cultural'
  category TEXT, -- More specific category
  classification TEXT, -- 'national_park', 'public_beach', 'monument', etc.
  
  -- Location
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  map_url TEXT,
  area_km2 DOUBLE PRECISION, -- Area in square kilometers (for parks, etc.)
  
  -- Media
  hero_image_url TEXT,
  image_urls TEXT[] DEFAULT '{}', -- Array of image URLs
  video_url TEXT,
  gallery_url TEXT, -- Link to photo gallery
  
  -- Content (DMO-managed content)
  content JSONB DEFAULT '{}', -- Flexible content structure
  highlights TEXT[], -- Array of highlight features
  facilities TEXT[], -- Available facilities (parking, restrooms, etc.)
  activities_available TEXT[], -- Activities available at this attraction
  best_time_to_visit TEXT, -- Best time/season to visit
  opening_hours JSONB, -- Opening hours (may vary by season)
  admission_fee DECIMAL(10, 2), -- Admission fee (if any)
  admission_currency TEXT DEFAULT 'THB',
  is_free BOOLEAN DEFAULT true,
  
  -- Accessibility
  accessibility_features TEXT[], -- 'wheelchair_accessible', 'parking', 'public_transport', etc.
  parking_available BOOLEAN DEFAULT false,
  parking_fee DECIMAL(10, 2),
  public_transport_available BOOLEAN DEFAULT false,
  public_transport_info TEXT,
  
  -- Safety and regulations
  safety_info TEXT,
  regulations TEXT[], -- Rules and regulations
  restrictions TEXT[], -- Any restrictions (no pets, no camping, etc.)
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published', 'temporarily_closed', 'archived'
  is_featured BOOLEAN DEFAULT false, -- Featured attraction
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional flexible data
  tags TEXT[] DEFAULT '{}',
  external_id TEXT, -- External system ID (if imported)
  external_source_url TEXT, -- Source URL if imported
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attractions_business_id ON attractions(business_id);
CREATE INDEX IF NOT EXISTS idx_attractions_created_by ON attractions(created_by);
CREATE INDEX IF NOT EXISTS idx_attractions_status ON attractions(status);
CREATE INDEX IF NOT EXISTS idx_attractions_attraction_type ON attractions(attraction_type);
CREATE INDEX IF NOT EXISTS idx_attractions_location_id ON attractions(location_id);
CREATE INDEX IF NOT EXISTS idx_attractions_managed_by_dmo ON attractions(managed_by_dmo);
CREATE INDEX IF NOT EXISTS idx_attractions_is_featured ON attractions(is_featured);
CREATE INDEX IF NOT EXISTS idx_attractions_tags_gin ON attractions USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_attractions_is_free ON attractions(is_free);

-- RLS Policies
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read published attractions
CREATE POLICY "Published attractions are viewable by authenticated users"
  ON attractions FOR SELECT
  TO authenticated
  USING (status = 'published' OR created_by = auth.uid());

-- Allow authenticated users to create attractions
CREATE POLICY "Authenticated users can create attractions"
  ON attractions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own attractions
CREATE POLICY "Users can update their own attractions"
  ON attractions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Allow users to delete their own attractions
CREATE POLICY "Users can delete their own attractions"
  ON attractions FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Super admins can manage all attractions
CREATE POLICY "Super admins can manage all attractions"
  ON attractions FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
        AND user_roles.is_active = true
    )
  );

COMMENT ON TABLE attractions IS 'Tourist attractions: beaches, parks, viewpoints, landmarks (DMO managed)';
COMMENT ON COLUMN attractions.managed_by_dmo IS 'Flag indicating this attraction is managed by DMO (may not have business entity)';
COMMENT ON COLUMN attractions.attraction_type IS 'Type: beach, park, viewpoint, landmark, natural, cultural';
COMMENT ON COLUMN attractions.opening_hours IS 'JSON describing opening hours (e.g., {"monday": "06:00-18:00", "tuesday": "06:00-18:00"})';

