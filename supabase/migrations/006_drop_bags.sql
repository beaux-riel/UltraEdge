-- Migration: 006_drop_bags
-- Description: Cloud-synced drop bags
-- Created: 2026-02-02

-- Drop bags table
CREATE TABLE drop_bags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  checkpoint_id UUID REFERENCES checkpoints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Local IDs for sync mapping
  local_id TEXT,
  local_event_id TEXT,
  local_checkpoint_id TEXT,
  
  -- Drop bag details
  name TEXT NOT NULL,
  description TEXT,
  
  -- Container info
  bag_type TEXT, -- 'bucket', 'bag', 'box', 'tote', etc.
  bag_color TEXT,
  label TEXT, -- What's written on the bag
  
  -- Contents (flexible JSON structure)
  items JSONB DEFAULT '[]',
  -- Structure: [{ name, quantity, category, weight, weight_unit, notes, packed }]
  
  -- Weight tracking (premium feature)
  total_weight DECIMAL(10, 3),
  weight_unit weight_unit DEFAULT 'lbs',
  
  -- Status
  status TEXT DEFAULT 'planning', -- 'planning', 'packed', 'checked_in', 'at_checkpoint', 'retrieved'
  packed_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  retrieved_at TIMESTAMPTZ,
  
  -- Order for display
  sort_order INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Photo of packed bag
  photo_url TEXT,
  
  -- Sync tracking
  synced_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop bag items table (alternative to JSONB for more structured querying)
CREATE TABLE drop_bag_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_bag_id UUID REFERENCES drop_bags(id) ON DELETE CASCADE NOT NULL,
  gear_item_id UUID REFERENCES gear_items(id) ON DELETE SET NULL, -- Link to gear library
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Local IDs for sync mapping
  local_id TEXT,
  local_drop_bag_id TEXT,
  local_gear_item_id TEXT,
  
  -- Item details (can override gear library)
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  category gear_category,
  
  -- Weight (can override gear library)
  weight DECIMAL(10, 3),
  weight_unit weight_unit DEFAULT 'oz',
  
  -- Status
  is_packed BOOLEAN DEFAULT false,
  packed_at TIMESTAMPTZ,
  
  -- Order for display
  sort_order INTEGER DEFAULT 0,
  
  -- Notes
  notes TEXT,
  
  -- Sync tracking
  synced_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for drop_bags
CREATE INDEX idx_drop_bags_event_id ON drop_bags(event_id);
CREATE INDEX idx_drop_bags_checkpoint_id ON drop_bags(checkpoint_id);
CREATE INDEX idx_drop_bags_user_id ON drop_bags(user_id);
CREATE INDEX idx_drop_bags_local_id ON drop_bags(user_id, local_id);
CREATE INDEX idx_drop_bags_not_deleted ON drop_bags(event_id) WHERE is_deleted = false;

-- Indexes for drop_bag_items
CREATE INDEX idx_drop_bag_items_drop_bag_id ON drop_bag_items(drop_bag_id);
CREATE INDEX idx_drop_bag_items_gear_item_id ON drop_bag_items(gear_item_id);
CREATE INDEX idx_drop_bag_items_user_id ON drop_bag_items(user_id);
CREATE INDEX idx_drop_bag_items_not_deleted ON drop_bag_items(drop_bag_id) WHERE is_deleted = false;

-- Triggers
CREATE TRIGGER update_drop_bags_updated_at
  BEFORE UPDATE ON drop_bags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drop_bag_items_updated_at
  BEFORE UPDATE ON drop_bag_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate drop bag total weight
CREATE OR REPLACE FUNCTION calculate_drop_bag_weight(p_drop_bag_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL := 0;
BEGIN
  -- First try from structured items table
  SELECT COALESCE(SUM(
    CASE 
      WHEN dbi.weight_unit = 'oz' THEN dbi.weight * dbi.quantity / 16 -- Convert to lbs
      WHEN dbi.weight_unit = 'g' THEN dbi.weight * dbi.quantity / 453.592
      WHEN dbi.weight_unit = 'kg' THEN dbi.weight * dbi.quantity * 2.20462
      ELSE dbi.weight * dbi.quantity -- Already in lbs
    END
  ), 0) INTO total
  FROM drop_bag_items dbi
  WHERE dbi.drop_bag_id = p_drop_bag_id
    AND dbi.is_deleted = false
    AND dbi.weight IS NOT NULL;
  
  -- Update the drop bag total weight
  UPDATE drop_bags 
  SET total_weight = total, weight_unit = 'lbs', updated_at = NOW()
  WHERE id = p_drop_bag_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to recalculate weight when items change
CREATE OR REPLACE FUNCTION recalculate_drop_bag_weight()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_drop_bag_weight(COALESCE(NEW.drop_bag_id, OLD.drop_bag_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_drop_bag_weight
  AFTER INSERT OR UPDATE OR DELETE ON drop_bag_items
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_drop_bag_weight();

COMMENT ON TABLE drop_bags IS 'Drop bags for events at specific checkpoints';
COMMENT ON TABLE drop_bag_items IS 'Individual items in drop bags';
COMMENT ON COLUMN drop_bags.items IS 'JSONB array of items (alternative to drop_bag_items table)';
