-- [2025-01-XX] - Direct verification of Sandy's events_superuser role
-- Run this in Supabase SQL Editor to verify the role exists and is active

-- Check Sandy's user record
SELECT 
  id,
  email,
  first_name,
  last_name,
  is_active,
  created_at
FROM users
WHERE id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
   OR email = 'sandybeachthailand@gmail.com';

-- Check Sandy's roles
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.is_active,
  ur.granted_at,
  ur.granted_by,
  u.email as user_email
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE ur.user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
ORDER BY ur.granted_at DESC;

-- Specifically check for events_superuser role
SELECT 
  ur.*,
  u.email
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE ur.user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND ur.role = 'events_superuser'
  AND ur.is_active = true;

-- Count total roles for Sandy
SELECT 
  COUNT(*) as total_roles,
  COUNT(*) FILTER (WHERE is_active = true) as active_roles,
  COUNT(*) FILTER (WHERE role = 'events_superuser') as events_superuser_count,
  COUNT(*) FILTER (WHERE role = 'events_superuser' AND is_active = true) as active_events_superuser_count
FROM user_roles
WHERE user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

