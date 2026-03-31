-- [2025-01-XX] - Simplified setup for 'events_superuser' role for Sandy
-- This version handles the case where Sandy might not exist in users table
-- Run this entire script in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Find Sandy's user ID and create user record if needed
-- IMPORTANT: First run find-sandy-user-id.sql to get the correct user ID
-- Sandy's user ID: 950a7fcb-d40f-4c33-aabb-44cc3fdd51eb
-- Email: sandybeachthailand@gmail.com
-- ============================================================================

-- First, verify Sandy exists in auth.users
SELECT id, email FROM auth.users WHERE id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

-- If Sandy exists in auth.users, create/update users table record
INSERT INTO users (id, email, first_name, last_name, is_active)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'firstName', 'Sandy') as first_name,
  COALESCE(au.raw_user_meta_data->>'lastName', 'Beach') as last_name,
  true as is_active
FROM auth.users au
WHERE au.id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- ============================================================================
-- STEP 2: Update the user_roles table constraint to allow 'events_superuser' role
-- ============================================================================
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('consumer', 'partner', 'admin', 'super_admin', 'events_superuser'));

-- ============================================================================
-- STEP 3: Grant Sandy the 'events_superuser' role
-- ============================================================================
INSERT INTO user_roles (user_id, role, is_active, granted_at)
VALUES (
  '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb',
  'events_superuser',
  true,
  NOW()
)
ON CONFLICT (user_id, role) 
DO UPDATE SET
  is_active = true,
  granted_at = NOW();

-- ============================================================================
-- STEP 4: Verify the setup
-- ============================================================================
SELECT 
  'User Record' as check_type,
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.is_active
FROM users u
WHERE u.id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';

SELECT 
  'Role Record' as check_type,
  ur.user_id,
  ur.role,
  ur.is_active,
  ur.granted_at
FROM user_roles ur
WHERE ur.user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND ur.role = 'events_superuser';

