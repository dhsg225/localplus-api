-- [2025-11-30] - Assign Business Types to Existing Businesses
-- ⚠️  IMPORTANT: Run business-types-schema.sql FIRST to create the tables!
-- This script will fail if business_types table doesn't exist.

-- Check if business_types table exists (will error if it doesn't - that's intentional)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_types') THEN
    RAISE EXCEPTION 'business_types table does not exist. Please run business-types-schema.sql first!';
  END IF;
END $$;

-- First, ensure the column exists (safe to run even if already exists)
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS business_type_id UUID REFERENCES business_types(id),
  ADD COLUMN IF NOT EXISTS business_type_tags TEXT[] DEFAULT '{}';

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_businesses_business_type_id ON businesses(business_type_id);

-- Example: Assign restaurant type to businesses with 'restaurant' in category or name
-- Note: Adjust column name if your table uses 'category_id' instead of 'category'
UPDATE businesses
SET business_type_id = (
  SELECT id FROM business_types WHERE key = 'restaurant'
)
WHERE business_type_id IS NULL
  AND (
    (category IS NOT NULL AND (
      LOWER(category) LIKE '%restaurant%' 
      OR LOWER(category) LIKE '%cafe%'
      OR LOWER(category) LIKE '%bar%'
      OR LOWER(category) LIKE '%food%'
    ))
    OR LOWER(name) LIKE '%restaurant%'
    OR LOWER(name) LIKE '%cafe%'
    OR LOWER(name) LIKE '%bar%'
  );

-- Example: Assign hotel type
UPDATE businesses
SET business_type_id = (
  SELECT id FROM business_types WHERE key = 'hotel'
)
WHERE business_type_id IS NULL
  AND (
    (category IS NOT NULL AND (
      LOWER(category) LIKE '%hotel%'
      OR LOWER(category) LIKE '%resort%'
      OR LOWER(category) LIKE '%accommodation%'
    ))
    OR LOWER(name) LIKE '%hotel%'
    OR LOWER(name) LIKE '%resort%'
  );

-- Example: Assign event organizer type (if you have event-related businesses)
UPDATE businesses
SET business_type_id = (
  SELECT id FROM business_types WHERE key = 'event_organizer'
)
WHERE business_type_id IS NULL
  AND (
    (category IS NOT NULL AND (
      LOWER(category) LIKE '%event%'
      OR LOWER(category) LIKE '%venue%'
    ))
    OR LOWER(name) LIKE '%event%'
    OR LOWER(name) LIKE '%venue%'
  );

-- Example: Assign service provider type (default for others)
UPDATE businesses
SET business_type_id = (
  SELECT id FROM business_types WHERE key = 'service_provider'
)
WHERE business_type_id IS NULL;

-- Verify assignments
SELECT 
  bt.name as business_type,
  COUNT(b.id) as business_count
FROM business_types bt
LEFT JOIN businesses b ON b.business_type_id = bt.id
GROUP BY bt.id, bt.name
ORDER BY business_count DESC;

