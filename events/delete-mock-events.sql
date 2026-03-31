-- [2025-11-29] - Delete mock events (Sunset Yoga, Hua Hin Beach Festival, Bangkok Rooftop Jazz)
-- These are test/mock events that should be removed

-- Find and delete mock events by title
DELETE FROM events
WHERE title IN (
  'Sunset Yoga by the Sea',
  'Hua Hin Beach Festival 2025',
  'Bangkok Rooftop Jazz Night'
);

-- Verify deletion
SELECT COUNT(*) as remaining_mock_events
FROM events
WHERE title IN (
  'Sunset Yoga by the Sea',
  'Hua Hin Beach Festival 2025',
  'Bangkok Rooftop Jazz Night'
);

-- Show total events count
SELECT 
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE status = 'published') as published_events,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_events,
  COUNT(*) FILTER (WHERE created_by = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc') as sandy_beach_events
FROM events;

