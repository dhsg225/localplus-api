-- [2025-11-29] - Add RLS policy to allow super admins to view all events
-- This allows users with 'super_admin' role (like Shannon) to view events from anyone

-- First, check if user_roles table exists and has the has_role function
-- If not, we'll use a direct check on user_roles table

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Super admins can view all events" ON events;

-- Add new policy: Super admins can view all events
-- This checks if the authenticated user has 'super_admin' role in user_roles table
-- Uses has_role() function if available, otherwise checks user_roles table directly
CREATE POLICY "Super admins can view all events"
  ON events FOR SELECT
  USING (
    -- Use has_role function if it exists (preferred method)
    (SELECT has_role(auth.uid(), 'super_admin'))
    OR
    -- Fallback: direct check on user_roles table
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
        AND user_roles.is_active = true
    )
  );

-- Also allow super admins to update/delete any event (optional - for full admin control)
DROP POLICY IF EXISTS "Super admins can update all events" ON events;
CREATE POLICY "Super admins can update all events"
  ON events FOR UPDATE
  USING (
    (SELECT has_role(auth.uid(), 'super_admin'))
    OR
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
        AND user_roles.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super admins can delete all events" ON events;
CREATE POLICY "Super admins can delete all events"
  ON events FOR DELETE
  USING (
    (SELECT has_role(auth.uid(), 'super_admin'))
    OR
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
        AND user_roles.is_active = true
    )
  );

-- Verify policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'events'
ORDER BY policyname;

