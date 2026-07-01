-- Migration: 005_checkpoints
-- Description: Cloud-synced checkpoints and aid stations
-- Created: 2026-02-02

-- Checkpoint type enum
CREATE TYPE checkpoint_type AS ENUM (
  'start',
  'aid_station',
  'water_only',
  'crew_access',
  'drop_bag',
  'timing_point',
  'landmark',
  'finish',
  'custom'
);

-- Checkpoints table
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Local IDs for sync mapping
  local_id TEXT,
  local_event_id TEXT,
  
  -- Checkpoint details
  name TEXT NOT NULL,
  checkpoint_type checkpoint_type DEFAULT 'aid_station',
  
  -- Distance from start
  distance_from_start DECIMAL(10, 2),
  distance_unit distance_unit, -- Inherit from event if null
  
  -- Elevation at checkpoint
  elevation DECIMAL(10, 2),
  elevation_unit elevation_unit, -- Inherit from event if null
  
  -- Segment info (calculated from previous checkpoint)
  segment_distance DECIMAL(10, 2),
  segment_elevation_gain DECIMAL(10, 2),
  segment_elevation_loss DECIMAL(10, 2),
  
  -- Timing
  cutoff_time INTERVAL, -- Time from race start
  cutoff_datetime TIMESTAMPTZ, -- Absolute cutoff (calculated from event start)
  estimated_arrival INTERVAL, -- Goal/estimated time from start
  actual_arrival TIMESTAMPTZ, -- Actual arrival during race
  time_spent INTERVAL, -- Time spent at checkpoint
  actual_departure TIMESTAMPTZ, -- Actual departure during race
  
  -- Pacing
  goal_pace_to_checkpoint INTERVAL, -- Target pace for segment
  actual_pace INTERVAL, -- Actual pace achieved (calculated)
  
  -- Access and amenities
  has_crew_access BOOLEAN DEFAULT false,
  has_drop_bag BOOLEAN DEFAULT false,
  has_medical BOOLEAN DEFAULT false,
  has_water BOOLEAN DEFAULT true,
  has_food BOOLEAN DEFAULT true,
  has_restroom BOOLEAN DEFAULT false,
  
  -- What's available at aid station
  available_items TEXT[], -- Array of available items
  
  -- Location
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  address TEXT,
  location_notes TEXT, -- "Big red tent near the barn"
  
  -- Order in event
  sort_order INTEGER NOT NULL,
  
  -- Notes
  notes TEXT,
  strategy_notes TEXT, -- Racing strategy for this checkpoint
  
  -- Status during race
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'in_progress', 'completed', 'skipped'
  
  -- Sync tracking
  synced_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_checkpoints_event_id ON checkpoints(event_id);
CREATE INDEX idx_checkpoints_user_id ON checkpoints(user_id);
CREATE INDEX idx_checkpoints_local_id ON checkpoints(user_id, local_id);
CREATE INDEX idx_checkpoints_sort_order ON checkpoints(event_id, sort_order);
CREATE INDEX idx_checkpoints_not_deleted ON checkpoints(event_id) WHERE is_deleted = false;
CREATE INDEX idx_checkpoints_with_drop_bag ON checkpoints(event_id) WHERE has_drop_bag = true;

-- Trigger
CREATE TRIGGER update_checkpoints_updated_at
  BEFORE UPDATE ON checkpoints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reorder checkpoints after insert/delete
CREATE OR REPLACE FUNCTION reorder_checkpoints(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE checkpoints
  SET sort_order = subq.new_order
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY sort_order, distance_from_start, created_at) AS new_order
    FROM checkpoints
    WHERE event_id = p_event_id AND is_deleted = false
  ) AS subq
  WHERE checkpoints.id = subq.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate segment distances
CREATE OR REPLACE FUNCTION calculate_segment_distances(p_event_id UUID)
RETURNS VOID AS $$
BEGIN
  WITH ordered_checkpoints AS (
    SELECT 
      id,
      distance_from_start,
      elevation,
      LAG(distance_from_start) OVER (ORDER BY sort_order) AS prev_distance,
      LAG(elevation) OVER (ORDER BY sort_order) AS prev_elevation
    FROM checkpoints
    WHERE event_id = p_event_id AND is_deleted = false
    ORDER BY sort_order
  )
  UPDATE checkpoints
  SET 
    segment_distance = COALESCE(oc.distance_from_start - COALESCE(oc.prev_distance, 0), 0),
    segment_elevation_gain = CASE 
      WHEN oc.elevation > oc.prev_elevation THEN oc.elevation - oc.prev_elevation 
      ELSE 0 
    END,
    segment_elevation_loss = CASE 
      WHEN oc.elevation < oc.prev_elevation THEN oc.prev_elevation - oc.elevation 
      ELSE 0 
    END
  FROM ordered_checkpoints oc
  WHERE checkpoints.id = oc.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE checkpoints IS 'Aid stations and checkpoints for events';
COMMENT ON COLUMN checkpoints.local_id IS 'AsyncStorage ID for sync mapping';
COMMENT ON COLUMN checkpoints.sort_order IS 'Order of checkpoint in event';
COMMENT ON COLUMN checkpoints.strategy_notes IS 'Racing strategy notes for this checkpoint';
