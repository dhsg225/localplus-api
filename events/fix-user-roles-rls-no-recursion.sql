-- [2025-01-XX] - Fix user_roles RLS policies to prevent infinite recursion
-- The issue: "Admins can manage user roles" policy queries user_roles, causing recursion
-- Solution: Use SECURITY DEFINER function to check roles without RLS recursion

-- Enable RLS on user_roles table if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can query their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Create a SECURITY DEFINER function to check if user is admin/superuser
-- This bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION is_admin_or_superuser(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = check_user_id 
    AND role IN ('admin', 'super_admin', 'events_superuser')
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy 1: Users can view their own roles (simple, no recursion)
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Policy 2: Admins can manage all user roles (uses function to avoid recursion)
CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  USING (is_admin_or_superuser(auth.uid()));

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
SELECT COUNT(*) as sandy_role_count
FROM user_roles
WHERE user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND role = 'events_superuser'
  AND is_active = true;

