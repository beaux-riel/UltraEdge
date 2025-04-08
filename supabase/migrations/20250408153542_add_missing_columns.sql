-- Migration to add missing columns to profiles table
-- This script should be run on the Supabase database to update existing profiles

-- First, check if columns exist and add them if they don't
DO $$
BEGIN
    -- Add profile_image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_image') THEN
        ALTER TABLE profiles ADD COLUMN profile_image TEXT;
    END IF;

    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE profiles ADD COLUMN location TEXT DEFAULT '';
    END IF;

    -- Add bio column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT DEFAULT '';
    END IF;

    -- Add preferences column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferences') THEN
        ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{"distanceUnit": "miles", "elevationUnit": "ft", "notifications": true, "darkMode": false}'::jsonb;
    END IF;

    -- Add stats column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stats') THEN
        ALTER TABLE profiles ADD COLUMN stats JSONB DEFAULT '{"racesPlanned": 0, "racesCompleted": 0, "totalDistance": 0, "appUsage": 0, "longestRace": 0}'::jsonb;
    END IF;

    -- Add achievements column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'achievements') THEN
        ALTER TABLE profiles ADD COLUMN achievements JSONB DEFAULT '[]'::jsonb;
    END IF;
END
$$;