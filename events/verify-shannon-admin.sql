-- [2025-11-29] - Verify and assign super_admin role to Shannon Green
-- This script checks if Shannon has super_admin role and assigns it if missing

-- First, find Shannon's user ID by email
-- Replace 'shannon.green.asia@gmail.com' with Shannon's actual email if different
DO $$
DECLARE
  shannon_user_id UUID;
  role_exists BOOLEAN;
BEGIN
  -- Find Shannon's user ID from users table (which references auth.users)
  SELECT id INTO shannon_user_id
  FROM users
  WHERE email = 'shannon.green.asia@gmail.com'
  LIMIT 1;

  IF shannon_user_id IS NULL THEN
    RAISE NOTICE 'Shannon user not found. Please check the email address.';
    RAISE NOTICE 'Available users:';
    FOR shannon_user_id IN SELECT id FROM users LIMIT 10 LOOP
      RAISE NOTICE 'User ID: %', shannon_user_id;
    END LOOP;
  ELSE
    RAISE NOTICE 'Found Shannon user ID: %', shannon_user_id;
    
    -- Check if super_admin role exists
    SELECT EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_id = shannon_user_id
        AND role = 'super_admin'
        AND is_active = true
    ) INTO role_exists;

    IF role_exists THEN
      RAISE NOTICE '✅ Shannon already has super_admin role';
    ELSE
      -- Check if user_roles table exists
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        -- Insert super_admin role (user_roles has UNIQUE(user_id, role) constraint)
        INSERT INTO user_roles (user_id, role, is_active, granted_at)
        VALUES (shannon_user_id, 'super_admin', true, NOW())
        ON CONFLICT (user_id, role) DO UPDATE
        SET is_active = true;
        
        RAISE NOTICE '✅ Assigned super_admin role to Shannon';
      ELSE
        RAISE NOTICE '⚠️  user_roles table does not exist. Please create it first.';
      END IF;
    END IF;
  END IF;
END $$;

-- Verify Shannon's roles
SELECT 
  u.email,
  u.id as user_id,
  u.first_name,
  u.last_name,
  ur.role,
  ur.is_active,
  ur.granted_at
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'shannon.green.asia@gmail.com'
ORDER BY ur.role;

