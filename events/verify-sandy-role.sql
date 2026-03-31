-- [2025-01-XX] - Verify Sandy's events_superuser role exists and is accessible
-- Run this in Supabase SQL Editor to diagnose why frontend can't see the role

-- Step 1: Check if Sandy's role exists
SELECT 
  ur.id,
  ur.user_id,
  ur.role,
  ur.is_active,
  ur.granted_at,
  u.email,
  u.is_active as user_is_active
FROM user_roles ur
JOIN users u ON u.id = ur.user_id
WHERE ur.user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND ur.role = 'events_superuser';

-- Step 2: Check RLS policies on user_roles table
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

-- Step 3: Test query as Sandy (simulating what frontend does)
-- This simulates auth.uid() = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claim.sub TO '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

-- Note: The above SET commands won't work in Supabase SQL Editor
-- Instead, we'll check if the policy allows the query
-- The policy should be: USING (auth.uid() = user_id)

-- Step 4: Check if there are conflicting policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles';

-- Step 5: Verify Sandy exists in users table
SELECT 
  id,
  email,
  first_name,
  last_name,
  is_active,
  created_at
FROM users
WHERE id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

-- Step 6: Check if Sandy exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

