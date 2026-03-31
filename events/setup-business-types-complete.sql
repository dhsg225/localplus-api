-- [2025-11-30] - Complete Business Types Setup Script
-- This script combines schema creation and business type assignment
-- Run this single script to set up the entire business type menu system

-- ============================================================================
-- PART 1: CREATE SCHEMA AND TABLES
-- ============================================================================

-- Drop and recreate business_types table to ensure correct structure
-- (This is safe because we'll re-insert the data in Part 2)
DROP TABLE IF EXISTS business_types CASCADE;

-- Business Types Table
CREATE TABLE business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT UNIQUE NOT NULL, -- 'restaurant', 'hotel', 'event_organizer', etc.
  name TEXT NOT NULL, -- 'Restaurant', 'Hotel', 'Event Organizer'
  description TEXT,
  icon TEXT, -- Icon name or URL
  color TEXT, -- Theme color hex
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Type Tags/Sub-types (for specialization)
CREATE TABLE IF NOT EXISTS business_type_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID REFERENCES business_types(id) ON DELETE CASCADE,
  "key" TEXT NOT NULL, -- 'bakery', 'fine_dining', 'boutique_hotel', etc.
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_type_id, "key")
);

-- Drop and recreate menu_items table to ensure correct structure
DROP TABLE IF EXISTS menu_items CASCADE;

-- Menu Items Configuration
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" TEXT UNIQUE NOT NULL, -- 'menu-management', 'orders', 'table-booking', etc.
  label TEXT NOT NULL,
  icon TEXT, -- Icon name or emoji
  route TEXT, -- Frontend route
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Type to Menu Mapping (many-to-many)
CREATE TABLE IF NOT EXISTS business_type_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type_id UUID REFERENCES business_types(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT false, -- Required menu vs optional
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_type_id, menu_item_id)
);

-- Update businesses table to include business_type
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS business_type_id UUID REFERENCES business_types(id),
  ADD COLUMN IF NOT EXISTS business_type_tags TEXT[] DEFAULT '{}'; -- Array of tag keys

-- Indexes
CREATE INDEX IF NOT EXISTS idx_business_types_key ON business_types(key);
CREATE INDEX IF NOT EXISTS idx_business_types_is_active ON business_types(is_active);
CREATE INDEX IF NOT EXISTS idx_business_type_tags_type_id ON business_type_tags(business_type_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_key ON menu_items(key);
CREATE INDEX IF NOT EXISTS idx_business_type_menus_type_id ON business_type_menus(business_type_id);
CREATE INDEX IF NOT EXISTS idx_business_type_menus_menu_id ON business_type_menus(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_businesses_business_type_id ON businesses(business_type_id);

-- View for easy querying: Business Type with Menus
CREATE OR REPLACE VIEW business_types_with_menus AS
SELECT 
  bt.id,
  bt."key",
  bt.name,
  bt.description,
  bt.icon,
  bt.color,
  bt.is_active,
  bt.sort_order,
  json_agg(
    json_build_object(
      'id', mi.id,
      'key', mi."key",
      'label', mi.label,
      'icon', mi.icon,
      'route', mi.route,
      'description', mi.description,
      'is_required', btm.is_required,
      'sort_order', btm.sort_order
    ) ORDER BY btm.sort_order, mi.sort_order
  ) FILTER (WHERE mi.id IS NOT NULL) as menus
FROM business_types bt
LEFT JOIN business_type_menus btm ON btm.business_type_id = bt.id
LEFT JOIN menu_items mi ON mi.id = btm.menu_item_id AND mi.is_active = true
WHERE bt.is_active = true
GROUP BY bt.id, bt."key", bt.name, bt.description, bt.icon, bt.color, bt.is_active, bt.sort_order
ORDER BY bt.sort_order, bt.name;

-- RLS Policies
ALTER TABLE business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_type_menus ENABLE ROW LEVEL SECURITY;

-- Anyone can view active business types
DROP POLICY IF EXISTS "Anyone can view active business types" ON business_types;
CREATE POLICY "Anyone can view active business types"
  ON business_types FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all business types
DROP POLICY IF EXISTS "Authenticated users can view all business types" ON business_types;
CREATE POLICY "Authenticated users can view all business types"
  ON business_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Anyone can view active menu items
DROP POLICY IF EXISTS "Anyone can view active menu items" ON menu_items;
CREATE POLICY "Anyone can view active menu items"
  ON menu_items FOR SELECT
  USING (is_active = true);

-- Anyone can view menu mappings
DROP POLICY IF EXISTS "Anyone can view business type menus" ON business_type_menus;
CREATE POLICY "Anyone can view business type menus"
  ON business_type_menus FOR SELECT
  USING (true);

-- Super admins can manage business types
DROP POLICY IF EXISTS "Super admins can manage business types" ON business_types;
CREATE POLICY "Super admins can manage business types"
  ON business_types FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'super_admin'
        AND user_roles.is_active = true
    )
  );

-- ============================================================================
-- PART 2: INSERT INITIAL DATA
-- ============================================================================

-- Insert initial business types
-- Note: Using quoted identifier for 'key' to avoid any potential reserved word issues
INSERT INTO business_types ("key", name, description, icon, color, sort_order) VALUES
  ('restaurant', 'Restaurant', 'Restaurants, cafes, bars, and food service businesses', '🍽️', '#ec4899', 1),
  ('hotel', 'Hotel', 'Hotels, resorts, and accommodation providers', '🏨', '#3b82f6', 2),
  ('event_organizer', 'Event Organizer', 'Event planning, venues, and event management', '🎟️', '#8b5cf6', 3),
  ('service_provider', 'Service Provider', 'General service providers (mechanics, installers, etc.)', '🔧', '#10b981', 4)
ON CONFLICT ("key") DO NOTHING;

-- Insert initial menu items
INSERT INTO menu_items ("key", label, icon, route, description, sort_order) VALUES
  -- Restaurant menus
  ('dashboard', 'Dashboard', '📊', '/dashboard', 'Overview and analytics', 1),
  ('menu-management', 'Menu Management', '📋', '/menu', 'Manage menu items and pricing', 10),
  ('orders', 'Orders', '📦', '/orders', 'View and manage orders', 20),
  ('table-booking', 'Table Booking', '🪑', '/bookings', 'Manage table reservations', 30),
  ('promotions', 'Promotions', '🎁', '/promotions', 'Create and manage promotions', 40),
  ('reviews', 'Reviews', '⭐', '/reviews', 'View customer reviews', 50),
  -- Hotel menus
  ('room-management', 'Room Management', '🛏️', '/rooms', 'Manage rooms and availability', 10),
  ('booking-calendar', 'Booking Calendar', '📅', '/bookings', 'View and manage bookings', 20),
  ('services', 'Services', '🛎️', '/services', 'Manage hotel services', 30),
  -- Event Organizer menus
  ('events', 'Events', '🎟️', '/events', 'Manage events', 10),
  ('venues', 'Venues', '📍', '/venues', 'Manage venues', 20),
  ('tickets', 'Tickets', '🎫', '/tickets', 'Manage ticket sales', 30),
  -- Service Provider menus
  ('appointments', 'Appointments', '📅', '/appointments', 'Manage appointments', 20),
  ('inventory', 'Inventory', '📦', '/inventory', 'Manage inventory', 30),
  -- Common menus
  ('notifications', 'Notifications', '🔔', '/notifications', 'Notification settings', 90),
  ('settings', 'Settings', '⚙️', '/settings', 'Account and business settings', 100),
  ('taxonomy', 'Categories', '🏷️', '/taxonomy', 'Manage event categories', 95),
  ('admin', 'Admin', '👥', '/admin', 'Admin functions', 99)
ON CONFLICT ("key") DO NOTHING;

-- Map menus to business types
-- Restaurant menus
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi."key" IN ('dashboard', 'orders') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt."key" = 'restaurant'
  AND mi."key" IN ('dashboard', 'menu-management', 'orders', 'table-booking', 'promotions', 'reviews', 'notifications', 'settings')
ON CONFLICT (business_type_id, menu_item_id) DO NOTHING;

-- Hotel menus
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'booking-calendar') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt."key" = 'hotel'
  AND mi."key" IN ('dashboard', 'room-management', 'booking-calendar', 'services', 'reviews', 'notifications', 'settings')
ON CONFLICT (business_type_id, menu_item_id) DO NOTHING;

-- Event Organizer menus
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'events') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt."key" = 'event_organizer'
  AND mi."key" IN ('dashboard', 'events', 'venues', 'tickets', 'reviews', 'notifications', 'settings', 'taxonomy')
ON CONFLICT (business_type_id, menu_item_id) DO NOTHING;

-- Service Provider menus
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'appointments') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt."key" = 'service_provider'
  AND mi."key" IN ('dashboard', 'services', 'appointments', 'inventory', 'reviews', 'notifications', 'settings')
ON CONFLICT (business_type_id, menu_item_id) DO NOTHING;

-- ============================================================================
-- PART 3: ASSIGN BUSINESS TYPES TO EXISTING BUSINESSES
-- ============================================================================

-- First, verify business_types table exists and has data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'business_types') THEN
    RAISE EXCEPTION 'business_types table does not exist. Part 1 of this script may have failed.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM business_types WHERE "key" = 'restaurant') THEN
    RAISE EXCEPTION 'business_types table exists but has no data. Part 2 of this script may have failed.';
  END IF;
END $$;

-- Assign restaurant type to businesses with 'restaurant' in category or name
UPDATE businesses b
SET business_type_id = bt.id
FROM business_types bt
WHERE bt."key" = 'restaurant'
  AND b.business_type_id IS NULL
  AND (
    -- Match on business name
    LOWER(b.name) LIKE '%restaurant%'
    OR LOWER(b.name) LIKE '%cafe%'
    OR LOWER(b.name) LIKE '%bar%'
    -- Match on category text column
    OR (b.category IS NOT NULL AND (
      LOWER(b.category) LIKE '%restaurant%' 
      OR LOWER(b.category) LIKE '%cafe%'
      OR LOWER(b.category) LIKE '%bar%'
      OR LOWER(b.category) LIKE '%food%'
    ))
  );

-- Assign hotel type
UPDATE businesses b
SET business_type_id = bt.id
FROM business_types bt
WHERE bt."key" = 'hotel'
  AND b.business_type_id IS NULL
  AND (
    LOWER(b.name) LIKE '%hotel%'
    OR LOWER(b.name) LIKE '%resort%'
    OR (b.category IS NOT NULL AND (
      LOWER(b.category) LIKE '%hotel%'
      OR LOWER(b.category) LIKE '%resort%'
      OR LOWER(b.category) LIKE '%accommodation%'
    ))
  );

-- Assign event organizer type (if you have event-related businesses)
UPDATE businesses b
SET business_type_id = bt.id
FROM business_types bt
WHERE bt."key" = 'event_organizer'
  AND b.business_type_id IS NULL
  AND (
    LOWER(b.name) LIKE '%event%'
    OR LOWER(b.name) LIKE '%venue%'
    OR (b.category IS NOT NULL AND (
      LOWER(b.category) LIKE '%event%'
      OR LOWER(b.category) LIKE '%venue%'
    ))
  );

-- Assign service provider type (default for others)
UPDATE businesses b
SET business_type_id = bt.id
FROM business_types bt
WHERE bt."key" = 'service_provider'
  AND b.business_type_id IS NULL;

-- ============================================================================
-- PART 4: VERIFICATION
-- ============================================================================

-- Verify assignments
SELECT 
  bt.name as business_type,
  COUNT(b.id) as business_count
FROM business_types bt
LEFT JOIN businesses b ON b.business_type_id = bt.id
GROUP BY bt.id, bt.name
ORDER BY business_count DESC;

-- Show summary
SELECT 
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM business_types) as business_types_created,
  (SELECT COUNT(*) FROM menu_items) as menu_items_created,
  (SELECT COUNT(*) FROM business_type_menus) as menu_mappings_created,
  (SELECT COUNT(*) FROM businesses WHERE business_type_id IS NOT NULL) as businesses_assigned;

