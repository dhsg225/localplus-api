-- [2025-11-29] - Check events count and status
-- Run this to verify events exist in the database

-- Total events count
SELECT 
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE status = 'published') as published_events,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_events,
  COUNT(*) FILTER (WHERE created_by = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc') as sandy_beach_events,
  COUNT(*) FILTER (WHERE created_by = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc' AND status = 'published') as sandy_beach_published,
  COUNT(*) FILTER (WHERE created_by = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc' AND status = 'draft') as sandy_beach_draft
FROM events;

-- Sample of Sandy Beach's events
SELECT 
  id,
  title,
  status,
  start_time,
  created_by,
  business_id
FROM events
WHERE created_by = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc'
ORDER BY start_time
LIMIT 10;

