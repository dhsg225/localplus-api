-- [2026-03-21] - Add ingestion-related columns to businesses table
-- This allows deduplication and enriched context from external sources

ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS external_source_url TEXT;

-- Create a unique constraint to support ON CONFLICT upserts
-- Before creating the constraint, we might need to handle existing duplicates if any, 
-- but since external_id is new, it should be null for all existing records.
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_source_external_id ON public.businesses (source, external_id) 
WHERE external_id IS NOT NULL;
