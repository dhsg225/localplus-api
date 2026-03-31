-- [2025-11-30] - Publish the last 20 draft events so they appear on mobile app
-- This updates the most recently created draft events to published status

-- First, show which events will be updated
SELECT 
  id,
  title,
  status,
  start_time,
  created_at,
  event_type
FROM events
WHERE status = 'draft'
ORDER BY created_at DESC
LIMIT 20;

-- Update the last 20 draft events to published
-- Using CTE to work around PostgreSQL limitation with LIMIT in subqueries
WITH draft_events_to_publish AS (
  SELECT id
  FROM events
  WHERE status = 'draft'
  ORDER BY created_at DESC
  LIMIT 20
)
UPDATE events
SET 
  status = 'published',
  updated_at = NOW()
WHERE id IN (SELECT id FROM draft_events_to_publish);

-- Verify the update
SELECT 
  COUNT(*) as total_published,
  COUNT(*) FILTER (WHERE status = 'published') as published_count,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_count
FROM events;

-- Show the updated events
SELECT 
  id,
  title,
  status,
  start_time,
  created_at,
  event_type
FROM events
WHERE status = 'published'
ORDER BY created_at DESC
LIMIT 20;

