-- [2025-01-XX] - Check current RLS policies on user_roles table
-- Run this in Supabase SQL Editor to see what policies exist

-- Step 1: Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

-- Step 2: List all policies on user_roles table
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression,
  roles
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Step 3: Check if there are any conflicting policies
-- (Multiple SELECT policies can cause issues)
SELECT 
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'user_roles'
  AND cmd = 'SELECT';

-- Step 4: Test query as Sandy (simulating frontend)
-- This should work if RLS policy is correct
-- Note: This will only work if run in Sandy's user context
-- In SQL Editor, it runs as postgres role, so it bypasses RLS
SELECT 
  role,
  is_active,
  granted_at
FROM user_roles
WHERE user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND role IN ('super_admin', 'events_superuser')
  AND is_active = true;

-- Step 5: Check if the function exists
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname = 'is_admin_or_superuser';

