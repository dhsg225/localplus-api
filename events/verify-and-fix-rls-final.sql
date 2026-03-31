-- [2025-01-XX] - Final verification and fix for user_roles RLS policies
-- This ensures users can query their own roles without recursion

-- Step 1: Check current policies
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Step 2: Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Users can query their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage user roles" ON user_roles;

-- Step 3: Create SECURITY DEFINER function (if it doesn't exist)
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

-- Step 4: Create simple SELECT policy for users to view their own roles
-- This is the critical one for frontend queries
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

-- Step 5: Create policy for admins to manage roles (uses function to avoid recursion)
CREATE POLICY "Admins can manage user roles"
  ON user_roles FOR ALL
  USING (is_admin_or_superuser(auth.uid()));

-- Step 6: Verify policies were created
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- Step 7: Test query (simulating what frontend does)
-- This should return Sandy's role if RLS is working correctly
SELECT 
  role,
  is_active,
  granted_at
FROM user_roles
WHERE user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND role IN ('super_admin', 'events_superuser')
  AND is_active = true;

-- Step 8: Verify Sandy's role exists (bypassing RLS with service role)
-- This confirms the data exists, separate from RLS
SELECT COUNT(*) as sandy_role_exists
FROM user_roles
WHERE user_id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND role = 'events_superuser'
  AND is_active = true;

