-- [2025-01-XX] - Check if Sandy exists in auth.users and users tables
-- Run this first to diagnose the issue

-- Check if Sandy exists in auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE id = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc'
   OR email = 'tlfox125@gmail.com'
   OR email = 'sandybeachthailand@gmail.com';

-- Check if Sandy exists in users table
SELECT 
  'users' as table_name,
  id,
  email,
  first_name,
  last_name,
  is_active,
  created_at
FROM users
WHERE id = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc';

-- Check if Sandy has any roles
SELECT 
  'user_roles' as table_name,
  ur.user_id,
  ur.role,
  ur.is_active,
  u.email
FROM user_roles ur
LEFT JOIN users u ON u.id = ur.user_id
WHERE ur.user_id = '1e9ad40a-6a66-4e20-8934-17a40d0ba5dc';

