-- [2025-01-XX] - Fix RLS policies by removing the overly permissive policy
-- The "Allow all operations on user_roles" policy with "true" is bypassing RLS

-- Step 1: Remove the problematic policy
DROP POLICY IF EXISTS "Allow all operations on user_roles" ON user_roles;

-- Step 2: Verify remaining policies
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Step 3: Test query (should now work correctly with RLS)
SELECT 
  role,
  is_active,
  granted_at
FROM user_roles
WHERE user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND role IN ('super_admin', 'events_superuser')
  AND is_active = true;

