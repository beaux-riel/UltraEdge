-- Migration: 003_events
-- Description: Cloud-synced endurance events
-- Created: 2026-02-02

-- Event status enum
CREATE TYPE event_status AS ENUM ('planning', 'ready', 'in_progress', 'completed', 'dnf', 'cancelled');

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Local ID for AsyncStorage mapping during sync
  local_id TEXT,
  
  -- Event details
  name TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  location TEXT,
  
  -- Distance and elevation
  distance DECIMAL(10, 2),
  distance_unit distance_unit DEFAULT 'miles',
  elevation_gain DECIMAL(10, 2),
  elevation_loss DECIMAL(10, 2),
  elevation_unit elevation_unit DEFAULT 'feet',
  
  -- Timing
  cutoff_time INTERVAL, -- Total event cutoff
  start_time TIME, -- Race start time
  
  -- Event info
  event_type TEXT, -- 'ultra', 'marathon', 'triathlon', 'hike', etc.
  terrain TEXT, -- 'trail', 'road', 'mixed', etc.
  aid_stations_provided BOOLEAN DEFAULT true,
  
  -- Status tracking
  status event_status DEFAULT 'planning',
  completed_at TIMESTAMPTZ,
  finish_time INTERVAL,
  
  -- Notes and description
  notes TEXT,
  website_url TEXT,
  gpx_file_url TEXT, -- S3/Storage URL if uploaded
  
  -- Sharing
  share_token TEXT UNIQUE, -- For read-only sharing links
  is_shared BOOLEAN DEFAULT false,
  
  -- Goal pacing (optional)
  goal_time INTERVAL,
  goal_pace_per_mile INTERVAL,
  goal_pace_per_km INTERVAL,
  
  -- Weather (cached from API or manual)
  weather_forecast JSONB,
  weather_updated_at TIMESTAMPTZ,
  
  -- Sync tracking
  synced_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 1,
  is_deleted BOOLEAN DEFAULT false, -- Soft delete for sync
  deleted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_local_id ON events(user_id, local_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_share_token ON events(share_token) WHERE share_token IS NOT NULL;
CREATE INDEX idx_events_synced_at ON events(synced_at);
CREATE INDEX idx_events_not_deleted ON events(user_id) WHERE is_deleted = false;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to enable sharing for an event
CREATE OR REPLACE FUNCTION enable_event_sharing(event_id UUID)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  token := generate_share_token();
  
  UPDATE events 
  SET share_token = token, is_shared = true, updated_at = NOW()
  WHERE id = event_id;
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE events IS 'Endurance events (races, ultras, hikes, etc.)';
COMMENT ON COLUMN events.local_id IS 'AsyncStorage ID for sync mapping';
COMMENT ON COLUMN events.share_token IS 'Token for read-only sharing links';
COMMENT ON COLUMN events.sync_version IS 'Version counter for conflict resolution';
