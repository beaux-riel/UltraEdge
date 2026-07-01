-- Migration: 002_user_profiles
-- Description: Extended user profiles for movers (athletes)
-- Created: 2026-02-02

-- Distance unit preference
CREATE TYPE distance_unit AS ENUM ('miles', 'kilometers');

-- Weight unit preference
CREATE TYPE weight_unit AS ENUM ('lbs', 'kg', 'oz', 'g');

-- Elevation unit preference
CREATE TYPE elevation_unit AS ENUM ('feet', 'meters');

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic info
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- Athlete profile
  body_weight DECIMAL(6, 2), -- Weight for total moving weight calculations
  body_weight_unit weight_unit DEFAULT 'lbs',
  
  -- Preferences
  preferred_distance_unit distance_unit DEFAULT 'miles',
  preferred_weight_unit weight_unit DEFAULT 'lbs',
  preferred_elevation_unit elevation_unit DEFAULT 'feet',
  
  -- Notification preferences
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  
  -- Timezone for event display
  timezone TEXT DEFAULT 'UTC',
  
  -- Onboarding state
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  
  -- App settings (stored as JSON for flexibility)
  settings JSONB DEFAULT '{}',
  
  -- Sync tracking
  last_sync_at TIMESTAMPTZ,
  sync_version INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Also create a free subscription record
  INSERT INTO user_subscriptions (user_id, rc_customer_id, entitlement)
  VALUES (
    NEW.id,
    'rc_' || NEW.id::TEXT, -- Temporary ID until RevenueCat syncs
    'free'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON TABLE user_profiles IS 'Extended user profiles for movers/athletes';
COMMENT ON COLUMN user_profiles.body_weight IS 'Athlete body weight for total moving weight calculations';
COMMENT ON COLUMN user_profiles.settings IS 'Flexible JSON settings storage for app preferences';
