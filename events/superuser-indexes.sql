-- [2025-11-29] - Performance indexes for superuser events view
-- These indexes optimize queries for large event datasets

-- Index on start_time (most common filter for upcoming/past events)
CREATE INDEX IF NOT EXISTS idx_events_start_time_desc ON events(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_events_start_time_asc ON events(start_time ASC);

-- Index on created_at (for sorting by newest)
CREATE INDEX IF NOT EXISTS idx_events_created_at_desc ON events(created_at DESC);

-- Index on business_id (for filtering by business)
CREATE INDEX IF NOT EXISTS idx_events_business_id ON events(business_id) WHERE business_id IS NOT NULL;

-- Index on status (for filtering published/draft/scraped)
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

-- Index on event_type (for category filtering)
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);

-- Index on created_by (for filtering by creator)
CREATE INDEX IF NOT EXISTS idx_events_created_by ON events(created_by) WHERE created_by IS NOT NULL;

-- Composite index for common superuser queries (status + start_time)
CREATE INDEX IF NOT EXISTS idx_events_status_start_time ON events(status, start_time DESC);

-- Composite index for business + status queries
CREATE INDEX IF NOT EXISTS idx_events_business_status ON events(business_id, status) WHERE business_id IS NOT NULL;

-- Verify indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'events'
ORDER BY indexname;

