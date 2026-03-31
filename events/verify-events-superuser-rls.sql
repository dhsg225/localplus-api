-- [2025-01-XX] - Verify RLS policy allows users to view their own roles
-- This ensures Sandy can query her events_superuser role

-- Check if the policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Test query as Sandy (replace with actual auth context)
-- This simulates what the frontend does
SELECT 
  role,
  is_active,
  granted_at
FROM user_roles
WHERE user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND role IN ('super_admin', 'events_superuser')
  AND is_active = true;

