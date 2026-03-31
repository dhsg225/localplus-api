-- [2025-11-30] - Business Types and Dynamic Menu System
-- Flexible partner management system with type-based menus and features

-- Business Types Table
CREATE TABLE IF NOT EXISTS business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'restaurant', 'hotel', 'event_organizer', etc.
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
  key TEXT NOT NULL, -- 'bakery', 'fine_dining', 'boutique_hotel', etc.
  label TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_type_id, key)
);

-- Menu Items Configuration
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL, -- 'menu-management', 'orders', 'table-booking', etc.
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
  bt.key,
  bt.name,
  bt.description,
  bt.icon,
  bt.color,
  bt.is_active,
  bt.sort_order,
  json_agg(
    json_build_object(
      'id', mi.id,
      'key', mi.key,
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
GROUP BY bt.id, bt.key, bt.name, bt.description, bt.icon, bt.color, bt.is_active, bt.sort_order
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

-- Insert initial business types
INSERT INTO business_types (key, name, description, icon, color, sort_order) VALUES
  ('restaurant', 'Restaurant', 'Restaurants, cafes, bars, and food service businesses', '🍽️', '#ec4899', 1),
  ('hotel', 'Hotel', 'Hotels, resorts, and accommodation providers', '🏨', '#3b82f6', 2),
  ('event_organizer', 'Event Organizer', 'Event planning, venues, and event management', '🎟️', '#8b5cf6', 3),
  ('service_provider', 'Service Provider', 'General service providers (mechanics, installers, etc.)', '🔧', '#10b981', 4)
ON CONFLICT (key) DO NOTHING;

-- Insert initial menu items
INSERT INTO menu_items (key, label, icon, route, description, sort_order) VALUES
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
  ('services', 'Services', '🔧', '/services', 'Manage services offered', 10),
  ('appointments', 'Appointments', '📅', '/appointments', 'Manage appointments', 20),
  ('inventory', 'Inventory', '📦', '/inventory', 'Manage inventory', 30),
  -- Common menus
  ('notifications', 'Notifications', '🔔', '/notifications', 'Notification settings', 90),
  ('settings', 'Settings', '⚙️', '/settings', 'Account and business settings', 100),
  ('taxonomy', 'Categories', '🏷️', '/taxonomy', 'Manage event categories', 95),
  ('admin', 'Admin', '👥', '/admin', 'Admin functions', 99)
ON CONFLICT (key) DO NOTHING;

-- Map menus to business types
-- Restaurant menus
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'orders') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt.key = 'restaurant'
  AND mi.key IN ('dashboard', 'menu-management', 'orders', 'table-booking', 'promotions', 'reviews', 'notifications', 'settings')
ON CONFLICT (business_type_id, menu_item_id) DO NOTHING;

-- Hotel menus
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'booking-calendar') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt.key = 'hotel'
  AND mi.key IN ('dashboard', 'room-management', 'booking-calendar', 'services', 'reviews', 'notifications', 'settings')
ON CONFLICT (business_type_id, menu_item_id) DO NOTHING;

-- Event Organizer menus
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'events') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt.key = 'event_organizer'
  AND mi.key IN ('dashboard', 'events', 'venues', 'tickets', 'reviews', 'notifications', 'settings', 'taxonomy')
ON CONFLICT (business_type_id, menu_item_id) DO NOTHING;

-- Service Provider menus
INSERT INTO business_type_menus (business_type_id, menu_item_id, is_required, sort_order)
SELECT bt.id, mi.id, 
  CASE WHEN mi.key IN ('dashboard', 'appointments') THEN true ELSE false END,
  mi.sort_order
FROM business_types bt
CROSS JOIN menu_items mi
WHERE bt.key = 'service_provider'
  AND mi.key IN ('dashboard', 'services', 'appointments', 'inventory', 'reviews', 'notifications', 'settings')
ON CONFLICT (business_type_id, menu_item_id) DO NOTHING;

-- Comments
COMMENT ON TABLE business_types IS 'Business type classification (restaurant, hotel, event organizer, etc.)';
COMMENT ON TABLE menu_items IS 'Available menu items/features in the partner app';
COMMENT ON TABLE business_type_menus IS 'Mapping of which menus each business type should see';
COMMENT ON VIEW business_types_with_menus IS 'Business types with their associated menu items';

