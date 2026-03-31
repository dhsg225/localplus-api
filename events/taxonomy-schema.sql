-- [2025-11-30] - Hierarchical Event Taxonomy System
-- Supports categories, sub-categories, and sub-sub-categories
-- Users can create, edit, and manage the taxonomy

-- Enhanced event_types table with hierarchy support
ALTER TABLE event_types
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES event_types(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1, -- 1 = category, 2 = sub-category, 3 = sub-sub-category
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS icon TEXT, -- Icon name or URL
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_event_types_parent_id ON event_types(parent_id);
CREATE INDEX IF NOT EXISTS idx_event_types_level ON event_types(level);
CREATE INDEX IF NOT EXISTS idx_event_types_is_active ON event_types(is_active);

-- Function to calculate level based on parent
CREATE OR REPLACE FUNCTION calculate_event_type_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.level := 1;
  ELSE
    SELECT level + 1 INTO NEW.level
    FROM event_types
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate level
DROP TRIGGER IF EXISTS trigger_calculate_event_type_level ON event_types;
CREATE TRIGGER trigger_calculate_event_type_level
  BEFORE INSERT OR UPDATE ON event_types
  FOR EACH ROW
  EXECUTE FUNCTION calculate_event_type_level();

-- Function to get full taxonomy path (e.g., "Music > Jazz > Live Performance")
CREATE OR REPLACE FUNCTION get_event_type_path(type_id UUID)
RETURNS TEXT AS $$
DECLARE
  path TEXT := '';
  current_id UUID := type_id;
  current_type RECORD;
BEGIN
  LOOP
    SELECT id, label, parent_id INTO current_type
    FROM event_types
    WHERE id = current_id;
    
    EXIT WHEN NOT FOUND;
    
    IF path = '' THEN
      path := current_type.label;
    ELSE
      path := current_type.label || ' > ' || path;
    END IF;
    
    EXIT WHEN current_type.parent_id IS NULL;
    current_id := current_type.parent_id;
  END LOOP;
  
  RETURN path;
END;
$$ LANGUAGE plpgsql;

-- View for hierarchical taxonomy display
CREATE OR REPLACE VIEW event_types_hierarchy AS
SELECT 
  et.id,
  et.key,
  et.label,
  et.description,
  et.color,
  et.icon,
  et.level,
  et.parent_id,
  et.sort_order,
  et.is_active,
  et.created_at,
  et.updated_at,
  get_event_type_path(et.id) as full_path,
  parent.label as parent_label,
  parent.key as parent_key
FROM event_types et
LEFT JOIN event_types parent ON et.parent_id = parent.id
WHERE et.is_active = true
ORDER BY et.level, et.sort_order, et.label;

-- RLS policies for event_types (users can view, admins can manage)
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active event types
DROP POLICY IF EXISTS "Anyone can view active event types" ON event_types;
CREATE POLICY "Anyone can view active event types"
  ON event_types FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can view all event types (including inactive for admin)
DROP POLICY IF EXISTS "Authenticated users can view all event types" ON event_types;
CREATE POLICY "Authenticated users can view all event types"
  ON event_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy: Super admins can manage event types
DROP POLICY IF EXISTS "Super admins can manage event types" ON event_types;
CREATE POLICY "Super admins can manage event types"
  ON event_types FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
        AND user_roles.is_active = true
    )
  );

-- Example: Insert some default categories
INSERT INTO event_types (key, label, description, color, level, sort_order, is_active)
VALUES
  ('music', 'Music', 'Music events and concerts', '#3b82f6', 1, 1, true),
  ('food', 'Food & Drink', 'Food and beverage events', '#ec4899', 1, 2, true),
  ('art', 'Art & Culture', 'Art exhibitions and cultural events', '#8b5cf6', 1, 3, true),
  ('wellness', 'Wellness', 'Health and wellness events', '#10b981', 1, 4, true),
  ('sports', 'Sports', 'Sports and fitness events', '#f97316', 1, 5, true),
  ('festival', 'Festival', 'Festivals and celebrations', '#f59e0b', 1, 6, true)
ON CONFLICT (key) DO NOTHING;

-- Example: Insert sub-categories for Music
INSERT INTO event_types (key, label, description, color, parent_id, level, sort_order, is_active)
SELECT
  'music-jazz', 'Jazz', 'Jazz concerts and performances', '#3b82f6', id, 2, 1, true
FROM event_types WHERE key = 'music'
ON CONFLICT (key) DO NOTHING;

INSERT INTO event_types (key, label, description, color, parent_id, level, sort_order, is_active)
SELECT
  'music-rock', 'Rock', 'Rock concerts', '#3b82f6', id, 2, 2, true
FROM event_types WHERE key = 'music'
ON CONFLICT (key) DO NOTHING;

-- Example: Insert sub-sub-category
INSERT INTO event_types (key, label, description, color, parent_id, level, sort_order, is_active)
SELECT
  'music-jazz-live', 'Live Performance', 'Live jazz performances', '#3b82f6', id, 3, 1, true
FROM event_types WHERE key = 'music-jazz'
ON CONFLICT (key) DO NOTHING;

-- Comments
COMMENT ON TABLE event_types IS 'Hierarchical event taxonomy: categories (level 1), sub-categories (level 2), sub-sub-categories (level 3)';
COMMENT ON COLUMN event_types.parent_id IS 'Parent category ID for hierarchy';
COMMENT ON COLUMN event_types.level IS 'Taxonomy level: 1=category, 2=sub-category, 3=sub-sub-category';
COMMENT ON FUNCTION get_event_type_path(UUID) IS 'Returns full taxonomy path (e.g., "Music > Jazz > Live Performance")';

