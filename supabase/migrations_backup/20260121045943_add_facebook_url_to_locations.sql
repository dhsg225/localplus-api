-- [2026-01-21] - Add facebook_url column to locations table
-- This supports social links for venues/locations

ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS facebook_url TEXT;

COMMENT ON COLUMN locations.facebook_url IS 'Facebook page or profile URL for the location';
