-- [2026-02-13] - Restaurant Menu Schema
-- Table for storing extracted menu items from OCR/AI ingestion

CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  category TEXT,           -- e.g., 'Appetizers', 'Main Course'
  name TEXT NOT NULL,      -- e.g., 'Pad Thai'
  price DECIMAL(10,2),     -- e.g., 150.00
  description TEXT,        -- Dish details
  image_url TEXT,          -- Future dish photo
  is_available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}', -- Raw AI output or processing notes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public can view active menu items" ON restaurant_menu_items;
CREATE POLICY "Public can view active menu items"
  ON restaurant_menu_items FOR SELECT
  USING (is_available = true);

DROP POLICY IF EXISTS "Owners can manage their own menu items" ON restaurant_menu_items;
CREATE POLICY "Owners can manage their own menu items"
  ON restaurant_menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM partners
      WHERE partners.business_id = restaurant_menu_items.business_id
      AND partners.user_id = auth.uid()
      AND partners.is_active = true
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_business_id ON restaurant_menu_items(business_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON restaurant_menu_items(category);

-- Trigger for updated_at
CREATE TRIGGER update_restaurant_menu_items_updated_at
  BEFORE UPDATE ON restaurant_menu_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
