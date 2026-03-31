-- [2025-12-02] - Add Activities and Attractions Business Types
-- Activities: Tourism activities (tours, water sports, adventure activities) - typically have business entities
-- Attractions: Beaches, parks, viewpoints - may NOT have business entities (DMO management)

-- ============================================================================
-- PART 1: ADD NEW BUSINESS TYPES
-- ============================================================================

-- Insert Activities business type
INSERT INTO business_types (key, name, description, icon, color, sort_order) VALUES
  ('activities', 'Activities', 'Tourism activities: tours, water sports, adventure activities, experiences', '🏄', '#06b6d4', 5),
  ('attractions', 'Attractions', 'Tourist attractions: beaches, parks, viewpoints, landmarks (DMO managed)', '🏖️', '#f59e0b', 6)
ON CONFLICT (key) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      icon = EXCLUDED.icon,
      color = EXCLUDED.color,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW();

-- ============================================================================
-- PART 2: ADD NEW MENU ITEMS FOR ACTIVITIES AND ATTRACTIONS
-- ============================================================================

-- Menu items for Activities
INSERT INTO menu_items (key, label, icon, route, description, sort_order) VALUES
  -- Activities-specific menus
  ('activities-management', 'Activities', '🏄', '/activities', 'Manage tourism activities and experiences', 10),
  ('activity-bookings', 'Bookings', '📅', '/activity-bookings', 'View and manage activity bookings', 20),
  ('activity-packages', 'Packages', '📦', '/activity-packages', 'Create and manage activity packages', 30),
  ('activity-availability', 'Availability', '📊', '/activity-availability', 'Manage activity schedules and availability', 40),
  -- Attractions-specific menus
  ('attractions-management', 'Attractions', '🏖️', '/attractions', 'Manage tourist attractions and landmarks', 10),
  ('attractions-content', 'Content', '📝', '/attractions-content', 'Manage attraction descriptions, photos, and content', 20),
  ('attractions-locations', 'Locations', '📍', '/attractions-locations', 'Manage attraction locations and maps', 30),
  ('dmo-dashboard', 'DMO Dashboard', '🌐', '/dmo-dashboard', 'Destination Marketing Organization overview', 5)
ON CONFLICT (key) DO UPDATE
  SET label = EXCLUDED.label,
      icon = EXCLUDED.icon,
      route = EXCLUDED.route,
      description = EXCLUDED.description,
      sort_order = EXCLUDED.sort_order,
      updated_at = NOW();

-- ============================================================================
-- PART 3: MAP MENUS TO BUSINESS TYPES
-- ============================================================================

-- Activities menus (similar to event organizer - has business entities)
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'activities-management') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt.key = 'activities'
  AND mi.key IN (
    'dashboard',
    'activities-management',
    'activity-bookings',
    'activity-packages',
    'activity-availability',
    'reviews',
    'notifications',
    'settings'
  )
ON CONFLICT (business_type_id, menu_item_id) DO UPDATE
  SET is_required = EXCLUDED.is_required,
      sort_order = EXCLUDED.sort_order;

-- Attractions menus (DMO-focused, may not have business entities)
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'attractions-management') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt.key = 'attractions'
  AND mi.key IN (
    'dashboard',
    'dmo-dashboard',
    'attractions-management',
    'attractions-content',
    'attractions-locations',
    'events',  -- Attractions may host events
    'venues',  -- Attractions may have venues
    'locations',  -- Location management
    'taxonomy',  -- Category management
    'notifications',
    'settings',
    'admin'  -- DMO may need admin access
  )
ON CONFLICT (business_type_id, menu_item_id) DO UPDATE
  SET is_required = EXCLUDED.is_required,
      sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- PART 4: ADD BUSINESS TYPE TAGS (OPTIONAL SUB-TYPES)
-- ============================================================================

-- Activity tags
INSERT INTO business_type_tags (business_type_id, key, label, description)
SELECT bt.id, tag.key, tag.label, tag.description
FROM business_types bt
CROSS JOIN (VALUES
  ('water_sports', 'Water Sports', 'Snorkeling, diving, kayaking, paddleboarding'),
  ('adventure', 'Adventure', 'Hiking, zip-lining, rock climbing, ATV tours'),
  ('tours', 'Tours', 'City tours, cultural tours, food tours'),
  ('experiences', 'Experiences', 'Cooking classes, workshops, cultural experiences')
) AS tag(key, label, description)
WHERE bt.key = 'activities'
ON CONFLICT (business_type_id, key) DO UPDATE
  SET label = EXCLUDED.label,
      description = EXCLUDED.description;

-- Attraction tags
INSERT INTO business_type_tags (business_type_id, key, label, description)
SELECT bt.id, tag.key, tag.label, tag.description
FROM business_types bt
CROSS JOIN (VALUES
  ('beaches', 'Beaches', 'Beaches and coastal areas'),
  ('parks', 'Parks', 'National parks, nature parks, gardens'),
  ('viewpoints', 'Viewpoints', 'Scenic viewpoints and observation points'),
  ('landmarks', 'Landmarks', 'Historical landmarks and monuments'),
  ('natural', 'Natural', 'Natural attractions (waterfalls, caves, etc.)'),
  ('cultural', 'Cultural', 'Cultural sites and heritage locations')
) AS tag(key, label, description)
WHERE bt.key = 'attractions'
ON CONFLICT (business_type_id, key) DO UPDATE
  SET label = EXCLUDED.label,
      description = EXCLUDED.description;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE business_types IS 'Business type classification now includes Activities and Attractions for DMO management';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully added Activities and Attractions business types';
  RAISE NOTICE '   - Activities: Tourism activities with business entities';
  RAISE NOTICE '   - Attractions: Tourist attractions (may not have business entities, DMO managed)';
END $$;

