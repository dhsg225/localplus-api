-- [2025-11-29] - Audit logging table for superuser event actions
-- Tracks all changes made by super admins for compliance and debugging

CREATE TABLE IF NOT EXISTS event_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'publish', 'unpublish', 'flag', 'approve'
  previous_data JSONB, -- Snapshot of event before change
  new_data JSONB, -- Snapshot of event after change
  changed_fields TEXT[], -- Array of field names that changed
  reason TEXT, -- Optional reason for the action
  ip_address INET, -- IP address of the admin
  user_agent TEXT, -- Browser/client info
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_event_audit_logs_event_id ON event_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_event_audit_logs_admin_user_id ON event_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_event_audit_logs_action ON event_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_event_audit_logs_created_at ON event_audit_logs(created_at DESC);

-- RLS: Only super admins can view audit logs
ALTER TABLE event_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all audit logs"
  ON event_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
        AND user_roles.is_active = true
    )
  );

-- Function to automatically log changes (trigger-based)
CREATE OR REPLACE FUNCTION log_event_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if changed by a super admin (check via application context)
  -- This will be called from the API, not a trigger
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE event_audit_logs IS 'Audit trail of all superuser actions on events for compliance and debugging';

