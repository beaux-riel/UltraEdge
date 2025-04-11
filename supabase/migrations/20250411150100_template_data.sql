-- Migration to add template data for nutrition and hydration plans
-- This script should be run on the Supabase database to create template data

-- Create a function to insert template data
CREATE OR REPLACE FUNCTION create_template_data()
RETURNS VOID AS $$
DECLARE
    template_user_id UUID;
BEGIN
    -- Create a special template user if it doesn't exist
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        'templates@ultraedge.app',
        '{"name": "UltraEdge Templates"}'::jsonb
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO template_user_id;

    -- If template user wasn't created, get the ID
    IF template_user_id IS NULL THEN
        SELECT id INTO template_user_id FROM auth.users WHERE email = 'templates@ultraedge.app';
    END IF;

    -- Create Nutrition Plan Templates
    
    -- 1. Liquid Nutrition Plan
    INSERT INTO nutrition_plans (
        user_id, name, description, race_type, race_duration, 
        terrain_type, weather_condition, intensity_level
    ) VALUES (
        template_user_id,
        'Liquid Nutrition Plan',
        'A nutrition plan focused on liquid calories for easy digestion during high-intensity efforts.',
        'Ultra Marathon',
        '12:00:00'::interval,
        'Mixed',
        'Moderate',
        'High'
    )
    ON CONFLICT DO NOTHING;
    
    -- 2. Real Food Nutrition Plan
    INSERT INTO nutrition_plans (
        user_id, name, description, race_type, race_duration, 
        terrain_type, weather_condition, intensity_level
    ) VALUES (
        template_user_id,
        'Real Food Nutrition Plan',
        'A nutrition plan focused on whole foods and minimal processed products for sustained energy.',
        'Ultra Marathon',
        '24:00:00'::interval,
        'Mountain',
        'Variable',
        'Moderate'
    )
    ON CONFLICT DO NOTHING;
    
    -- 3. Hybrid Nutrition Plan
    INSERT INTO nutrition_plans (
        user_id, name, description, race_type, race_duration, 
        terrain_type, weather_condition, intensity_level
    ) VALUES (
        template_user_id,
        'Hybrid Nutrition Plan',
        'A balanced approach combining liquid nutrition and real food for optimal performance.',
        'Ultra Marathon',
        '16:00:00'::interval,
        'Mixed',
        'Moderate',
        'Moderate-High'
    )
    ON CONFLICT DO NOTHING;
    
    -- 4. Standard Nutrition Plan
    INSERT INTO nutrition_plans (
        user_id, name, description, race_type, race_duration, 
        terrain_type, weather_condition, intensity_level
    ) VALUES (
        template_user_id,
        'Standard Nutrition Plan',
        'A well-balanced nutrition plan suitable for most ultra runners in standard conditions.',
        'Ultra Marathon',
        '10:00:00'::interval,
        'Trail',
        'Mild',
        'Moderate'
    )
    ON CONFLICT DO NOTHING;
    
    -- 5. High-Calorie Nutrition Plan
    INSERT INTO nutrition_plans (
        user_id, name, description, race_type, race_duration, 
        terrain_type, weather_condition, intensity_level
    ) VALUES (
        template_user_id,
        'High-Calorie Nutrition Plan',
        'A high-calorie nutrition plan for extreme efforts or cold weather conditions.',
        'Ultra Marathon',
        '30:00:00'::interval,
        'Mountain',
        'Cold',
        'High'
    )
    ON CONFLICT DO NOTHING;

    -- Create Hydration Plan Templates
    
    -- 1. Minimal Hydration Plan
    INSERT INTO hydration_plans (
        user_id, name, description, race_type, race_duration, 
        terrain_type, weather_condition, intensity_level
    ) VALUES (
        template_user_id,
        'Minimal Hydration Plan',
        'A lightweight hydration approach for cooler conditions or shorter efforts.',
        'Ultra Marathon',
        '06:00:00'::interval,
        'Trail',
        'Cool',
        'Moderate'
    )
    ON CONFLICT DO NOTHING;
    
    -- 2. Standard Hydration Plan
    INSERT INTO hydration_plans (
        user_id, name, description, race_type, race_duration, 
        terrain_type, weather_condition, intensity_level
    ) VALUES (
        template_user_id,
        'Standard Hydration Plan',
        'A balanced hydration approach suitable for most ultra runners in moderate conditions.',
        'Ultra Marathon',
        '12:00:00'::interval,
        'Mixed',
        'Moderate',
        'Moderate'
    )
    ON CONFLICT DO NOTHING;
    
    -- 3. High Volume Hydration Plan
    INSERT INTO hydration_plans (
        user_id, name, description, race_type, race_duration, 
        terrain_type, weather_condition, intensity_level
    ) VALUES (
        template_user_id,
        'High Volume Hydration Plan',
        'An aggressive hydration strategy for hot conditions or high sweat rate athletes.',
        'Ultra Marathon',
        '24:00:00'::interval,
        'Desert',
        'Hot',
        'High'
    )
    ON CONFLICT DO NOTHING;

    -- Add sample entries to the templates
    -- For Liquid Nutrition Plan
    INSERT INTO nutrition_entries (
        plan_id, food_type, calories, carbs, protein, fat, 
        timing, frequency, quantity, sodium, potassium, 
        magnesium, is_essential, source_location, notes
    )
    SELECT 
        id, 'Energy Gel', 100, 25, 0, 0, 
        'Every 30 minutes', 'Hourly', 1, 50, 30, 
        0, TRUE, 'Aid Station', 'Consume with water'
    FROM nutrition_plans 
    WHERE name = 'Liquid Nutrition Plan' AND user_id = template_user_id
    ON CONFLICT DO NOTHING;

    INSERT INTO nutrition_entries (
        plan_id, food_type, calories, carbs, protein, fat, 
        timing, frequency, quantity, sodium, potassium, 
        magnesium, is_essential, source_location, notes
    )
    SELECT 
        id, 'Sports Drink', 80, 20, 0, 0, 
        'Continuous', 'Hourly', 250, 100, 50, 
        10, TRUE, 'Carried', 'Primary hydration source'
    FROM nutrition_plans 
    WHERE name = 'Liquid Nutrition Plan' AND user_id = template_user_id
    ON CONFLICT DO NOTHING;

    -- For Standard Hydration Plan
    INSERT INTO hydration_entries (
        plan_id, liquid_type, volume, electrolytes, timing, 
        frequency, consumption_rate, temperature, source_location, container_type
    )
    SELECT 
        id, 'Water', 500, '{"sodium": 100, "potassium": 50, "magnesium": 10}'::jsonb, 'Hourly', 
        'Every aid station', 500, 'Cold', 'Aid Station', 'Soft Flask'
    FROM hydration_plans 
    WHERE name = 'Standard Hydration Plan' AND user_id = template_user_id
    ON CONFLICT DO NOTHING;

    INSERT INTO hydration_entries (
        plan_id, liquid_type, volume, electrolytes, timing, 
        frequency, consumption_rate, temperature, source_location, container_type
    )
    SELECT 
        id, 'Electrolyte Drink', 250, '{"sodium": 200, "potassium": 100, "magnesium": 20}'::jsonb, 'Every 2 hours', 
        'Every other aid station', 250, 'Cool', 'Carried', 'Soft Flask'
    FROM hydration_plans 
    WHERE name = 'Standard Hydration Plan' AND user_id = template_user_id
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create template data
SELECT create_template_data();

-- Drop the function after use
DROP FUNCTION create_template_data();