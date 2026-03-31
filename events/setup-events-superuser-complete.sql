-- [2025-01-XX] - Complete setup for 'events_superuser' role for Sandy
-- Run this entire script in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Ensure Sandy exists in users table (required for user_roles foreign key)
-- Sandy's user ID: 950a7fcb-d40f-4c33-aabb-44cc3fdd51eb
-- Email: sandybeachthailand@gmail.com
-- ============================================================================

-- First, check if Sandy exists in auth.users and get their email
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
-- STEP 3: Update RLS policies to allow 'events_superuser' role full access
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view published events" ON events;
DROP POLICY IF EXISTS "Users can create events for their businesses" ON events;
DROP POLICY IF EXISTS "Users can update events they own or have editor access" ON events;
DROP POLICY IF EXISTS "Users can delete events they own" ON events;

-- Recreate policies with events_superuser bypass

-- SELECT policy: Allow events_superuser to see ALL events, others see published/own/business events
CREATE POLICY "Users can view published events"
  ON events FOR SELECT
  USING (
    -- Events superuser can see everything
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'events_superuser'
      AND user_roles.is_active = true
    )
    OR
    -- Regular access rules
    status = 'published'
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM partners
      WHERE partners.business_id = events.business_id
        AND partners.user_id = auth.uid()
        AND partners.is_active = true
    )
  );

-- INSERT policy: Allow events_superuser to create events for any business
CREATE POLICY "Users can create events for their businesses"
  ON events FOR INSERT
  WITH CHECK (
    -- Events superuser can create events for any business
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'events_superuser'
      AND user_roles.is_active = true
    )
    OR
    -- Regular access rules
    EXISTS (
      SELECT 1 FROM partners 
      WHERE partners.business_id = events.business_id 
      AND partners.user_id = auth.uid()
      AND partners.is_active = true
    ) OR
    created_by = auth.uid()
  );

-- UPDATE policy: Allow events_superuser to update ANY event
CREATE POLICY "Users can update events they own or have editor access"
  ON events FOR UPDATE
  USING (
    -- Events superuser can update any event
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'events_superuser'
      AND user_roles.is_active = true
    )
    OR
    -- Regular access rules
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM partners
      WHERE partners.business_id = events.business_id
        AND partners.user_id = auth.uid()
        AND partners.is_active = true
    )
  );

-- DELETE policy: Allow events_superuser to delete ANY event
CREATE POLICY "Users can delete events they own"
  ON events FOR DELETE
  USING (
    -- Events superuser can delete any event
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'events_superuser'
      AND user_roles.is_active = true
    )
    OR
    -- Regular access rules
    created_by = auth.uid()
  );

-- ============================================================================
-- STEP 4: Verify the role was granted
-- ============================================================================
SELECT 
  u.email,
  ur.role,
  ur.is_active,
  ur.granted_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.id = '950a7fcb-d40f-4c33-aabb-44cc3fdd51eb'
  AND ur.role = 'events_superuser';

