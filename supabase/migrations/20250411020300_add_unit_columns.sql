-- Migration to add distance_units and elevation_units columns to races table
-- This script should be run on the Supabase database to update existing races

-- First, check if columns exist and add them if they don't
DO $$
BEGIN
    -- Add distance_units column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'distance_units') THEN
        ALTER TABLE races ADD COLUMN distance_units TEXT DEFAULT 'miles';
    END IF;

    -- Add elevation_units column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'races' AND column_name = 'elevation_units') THEN
        ALTER TABLE races ADD COLUMN elevation_units TEXT DEFAULT 'ft';
    END IF;
END
$$;