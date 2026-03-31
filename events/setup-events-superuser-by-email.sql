-- [2025-01-XX] - Setup events_superuser role by finding Sandy's user ID from email
-- This script finds Sandy by email and grants the role
-- Run this entire script in Supabase SQL Editor

DO $$
DECLARE
  sandy_user_id UUID := '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'; -- Sandy's actual user ID
  sandy_email TEXT := 'sandybeachthailand@gmail.com';
BEGIN
  -- Verify Sandy exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = sandy_user_id) THEN
    RAISE EXCEPTION 'Sandy not found in auth.users with ID %. Please verify.', sandy_user_id;
  END IF;
  
  RAISE NOTICE 'Setting up events_superuser role for Sandy (user_id: %)', sandy_user_id;
  
  -- Ensure Sandy exists in users table
  INSERT INTO users (id, email, first_name, last_name, is_active)
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'firstName', 'Sandy') as first_name,
    COALESCE(au.raw_user_meta_data->>'lastName', 'Beach') as last_name,
    true as is_active
  FROM auth.users au
  WHERE au.id = sandy_user_id
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  -- Update constraint
  ALTER TABLE user_roles 
  DROP CONSTRAINT IF EXISTS user_roles_role_check;
  
  ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('consumer', 'partner', 'admin', 'super_admin', 'events_superuser'));
  
  -- Grant role
  INSERT INTO user_roles (user_id, role, is_active, granted_at)
  VALUES (sandy_user_id, 'events_superuser', true, NOW())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET
    is_active = true,
    granted_at = NOW();
  
  RAISE NOTICE 'Successfully granted events_superuser role to Sandy (user_id: %)', sandy_user_id;
END $$;

-- Verify
SELECT 
  u.id,
  u.email,
  ur.role,
  ur.is_active
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'events_superuser';
