-- [2025-01-XX] - Find Sandy's actual user ID in auth.users
-- Run this to find the correct user ID

-- Search by email addresses we know Sandy might use
SELECT 
  'auth.users' as source,
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'firstName' as first_name,
  raw_user_meta_data->>'lastName' as last_name,
  created_at
FROM auth.users
WHERE email ILIKE '%sandy%'
   OR email ILIKE '%tlfox125%'
   OR email ILIKE '%sandybeach%'
   OR raw_user_meta_data->>'firstName' ILIKE '%sandy%'
ORDER BY created_at DESC;

-- Also check if the ID we have exists anywhere
SELECT 
  'auth.users by ID' as source,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE id = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc';

-- Check users table for any Sandy records
SELECT 
  'users table' as source,
  id,
  email,
  first_name,
  last_name,
  created_at
FROM users
WHERE email ILIKE '%sandy%'
   OR email ILIKE '%tlfox125%'
   OR email ILIKE '%sandybeach%'
   OR first_name ILIKE '%sandy%'
ORDER BY created_at DESC;

-- Check events table to see who created events (might give us Sandy's ID)
SELECT DISTINCT
  'events.created_by' as source,
  created_by as user_id,
  COUNT(*) as event_count
FROM events
WHERE created_by IS NOT NULL
GROUP BY created_by
ORDER BY event_count DESC
LIMIT 10;

