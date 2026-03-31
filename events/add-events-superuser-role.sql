-- [2025-01-XX] - Add 'events_superuser' role for Sandy
-- This role allows full CRUD access to ALL events regardless of ownership or business association

-- Step 1: Ensure Sandy exists in users table (required for user_roles foreign key)
-- Sandy's user ID: 950a7fcb-d40f-4c33-aabb-44cc3fdd51eb
-- Email: sandybeachthailand@gmail.com
DO $$
DECLARE
  sandy_id UUID := '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb';
  sandy_email TEXT;
  sandy_first_name TEXT;
  sandy_last_name TEXT;
BEGIN
  -- Get Sandy's info from auth.users
  SELECT 
    au.email,
    COALESCE(au.raw_user_meta_data->>'firstName', 'Sandy'),
    COALESCE(au.raw_user_meta_data->>'lastName', 'Beach')
  INTO sandy_email, sandy_first_name, sandy_last_name
  FROM auth.users au
  WHERE au.id = sandy_id;
  
  -- If Sandy exists in auth.users, ensure they exist in users table
  IF sandy_email IS NOT NULL THEN
    INSERT INTO users (id, email, first_name, last_name, is_active)
    VALUES (sandy_id, sandy_email, sandy_first_name, sandy_last_name, true)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  ELSE
    RAISE EXCEPTION 'User with ID % does not exist in auth.users. Please verify the user ID.', sandy_id;
  END IF;
END $$;

-- Step 2: Update the user_roles table constraint to allow 'events_superuser' role
-- Note: This requires dropping and recreating the constraint
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles
ADD CONSTRAINT user_roles_role_check 
CHECK (role IN ('consumer', 'partner', 'admin', 'super_admin', 'events_superuser'));

-- Step 3: Grant Sandy the 'events_superuser' role
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

-- Step 3: Verify the role was granted
SELECT 
  u.email,
  ur.role,
  ur.is_active,
  ur.granted_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND ur.role = 'events_superuser';

