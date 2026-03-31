-- [2025-01-XX] - Complete fix for user_roles RLS policies
-- This ensures users can query their own roles (needed for events_superuser check)

-- Enable RLS on user_roles table if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can query their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Recreate the policy that allows users to view their own roles
-- This is critical for the frontend to check if user has events_superuser role
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Recreate the policy that allows admins to manage all user roles
CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'events_superuser')
      AND is_active = true
    )
  );

-- Verify the policies were created
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

-- Test: Verify Sandy's role is accessible (should return 1 row)
-- Note: This will only work if run as Sandy's user context
SELECT COUNT(*) as sandy_role_count
FROM user_roles
WHERE user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND role = 'events_superuser'
  AND is_active = true;

