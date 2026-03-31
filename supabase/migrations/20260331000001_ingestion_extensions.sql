-- Phase I3-A: Stability + Extensibility Layer

-- 1. Source Profile Layer
ALTER TABLE ingestion_batches ADD COLUMN source_profile VARCHAR(100);

-- 2. Venue Alias Support (Foundation)
CREATE TABLE venue_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  alias_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id, alias_name)
);

-- Index for performance in matching
CREATE INDEX idx_venue_aliases_name ON venue_aliases(alias_name);
