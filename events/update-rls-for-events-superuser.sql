-- [2025-01-XX] - Update RLS policies to allow 'events_superuser' role full access
-- This allows events_superuser to bypass all restrictions on events CRUD operations

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

