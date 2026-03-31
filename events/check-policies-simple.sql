-- Check RLS policies on user_roles table

-- Step 1: Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'user_roles';

-- Step 2: List all policies
SELECT 
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

