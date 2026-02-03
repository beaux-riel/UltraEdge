-- Migration: 004_gear
-- Description: Cloud-synced gear items for weight tracking
-- Created: 2026-02-02

-- Gear category enum
CREATE TYPE gear_category AS ENUM (
  'footwear',
  'clothing',
  'hydration',
  'nutrition',
  'lighting',
  'navigation',
  'safety',
  'shelter',
  'electronics',
  'accessories',
  'other'
);

-- Gear items table (user's gear library)
CREATE TABLE gear_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Local ID for AsyncStorage mapping
  local_id TEXT,
  
  -- Gear details
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category gear_category DEFAULT 'other',
  
  -- Weight tracking (premium feature)
  weight DECIMAL(10, 3),
  weight_unit weight_unit DEFAULT 'oz',
  
  -- Quantity (e.g., 2 pairs of socks)
  quantity INTEGER DEFAULT 1,
  
  -- Status
  is_retired BOOLEAN DEFAULT false,
  retired_at TIMESTAMPTZ,
  
  -- Additional info
  notes TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  purchase_url TEXT,
  image_url TEXT,
  
  -- Tags for filtering
  tags TEXT[],
  
  -- Sync tracking
  synced_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event gear assignments (which gear is used for which event)
CREATE TABLE event_gear (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  gear_item_id UUID REFERENCES gear_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Local IDs for sync mapping
  local_id TEXT,
  local_event_id TEXT,
  local_gear_item_id TEXT,
  
  -- Assignment details
  quantity INTEGER DEFAULT 1, -- Override gear default quantity
  
  -- Where is this gear?
  assignment_type TEXT DEFAULT 'wearing', -- 'wearing', 'pack', 'drop_bag', 'crew'
  checkpoint_id UUID, -- If assigned to specific checkpoint drop bag
  drop_bag_id UUID, -- If assigned to specific drop bag
  
  -- Notes for this specific assignment
  notes TEXT,
  
  -- Is it packed/ready?
  is_packed BOOLEAN DEFAULT false,
  packed_at TIMESTAMPTZ,
  
  -- Sync tracking
  synced_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique gear assignment per event (unless deleted)
  CONSTRAINT unique_event_gear UNIQUE NULLS NOT DISTINCT (event_id, gear_item_id, checkpoint_id, drop_bag_id, is_deleted)
);

-- Indexes for gear_items
CREATE INDEX idx_gear_items_user_id ON gear_items(user_id);
CREATE INDEX idx_gear_items_local_id ON gear_items(user_id, local_id);
CREATE INDEX idx_gear_items_category ON gear_items(category);
CREATE INDEX idx_gear_items_not_retired ON gear_items(user_id) WHERE is_retired = false;
CREATE INDEX idx_gear_items_not_deleted ON gear_items(user_id) WHERE is_deleted = false;

-- Indexes for event_gear
CREATE INDEX idx_event_gear_event_id ON event_gear(event_id);
CREATE INDEX idx_event_gear_gear_item_id ON event_gear(gear_item_id);
CREATE INDEX idx_event_gear_user_id ON event_gear(user_id);
CREATE INDEX idx_event_gear_checkpoint ON event_gear(checkpoint_id) WHERE checkpoint_id IS NOT NULL;
CREATE INDEX idx_event_gear_drop_bag ON event_gear(drop_bag_id) WHERE drop_bag_id IS NOT NULL;

-- Triggers
CREATE TRIGGER update_gear_items_updated_at
  BEFORE UPDATE ON gear_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_gear_updated_at
  BEFORE UPDATE ON event_gear
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate total gear weight for an event
CREATE OR REPLACE FUNCTION calculate_event_gear_weight(p_event_id UUID, target_unit weight_unit DEFAULT 'oz')
RETURNS DECIMAL AS $$
DECLARE
  total_weight DECIMAL := 0;
  conversion_factor DECIMAL;
BEGIN
  SELECT COALESCE(SUM(
    CASE 
      WHEN g.weight_unit = 'oz' AND target_unit = 'oz' THEN g.weight * eg.quantity
      WHEN g.weight_unit = 'oz' AND target_unit = 'lbs' THEN (g.weight * eg.quantity) / 16
      WHEN g.weight_unit = 'oz' AND target_unit = 'g' THEN (g.weight * eg.quantity) * 28.3495
      WHEN g.weight_unit = 'oz' AND target_unit = 'kg' THEN (g.weight * eg.quantity) * 0.0283495
      WHEN g.weight_unit = 'lbs' AND target_unit = 'oz' THEN (g.weight * eg.quantity) * 16
      WHEN g.weight_unit = 'lbs' AND target_unit = 'lbs' THEN g.weight * eg.quantity
      WHEN g.weight_unit = 'lbs' AND target_unit = 'g' THEN (g.weight * eg.quantity) * 453.592
      WHEN g.weight_unit = 'lbs' AND target_unit = 'kg' THEN (g.weight * eg.quantity) * 0.453592
      WHEN g.weight_unit = 'g' AND target_unit = 'oz' THEN (g.weight * eg.quantity) / 28.3495
      WHEN g.weight_unit = 'g' AND target_unit = 'lbs' THEN (g.weight * eg.quantity) / 453.592
      WHEN g.weight_unit = 'g' AND target_unit = 'g' THEN g.weight * eg.quantity
      WHEN g.weight_unit = 'g' AND target_unit = 'kg' THEN (g.weight * eg.quantity) / 1000
      WHEN g.weight_unit = 'kg' AND target_unit = 'oz' THEN (g.weight * eg.quantity) / 0.0283495
      WHEN g.weight_unit = 'kg' AND target_unit = 'lbs' THEN (g.weight * eg.quantity) / 0.453592
      WHEN g.weight_unit = 'kg' AND target_unit = 'g' THEN (g.weight * eg.quantity) * 1000
      WHEN g.weight_unit = 'kg' AND target_unit = 'kg' THEN g.weight * eg.quantity
      ELSE 0
    END
  ), 0) INTO total_weight
  FROM event_gear eg
  JOIN gear_items g ON eg.gear_item_id = g.id
  WHERE eg.event_id = p_event_id
    AND eg.is_deleted = false
    AND g.weight IS NOT NULL;
    
  RETURN total_weight;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE gear_items IS 'User gear library with weight tracking';
COMMENT ON TABLE event_gear IS 'Gear assignments to specific events';
COMMENT ON FUNCTION calculate_event_gear_weight IS 'Calculate total gear weight for an event in specified unit';
