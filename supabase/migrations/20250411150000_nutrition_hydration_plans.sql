-- Migration to add enhanced nutrition and hydration plan tables
-- This script should be run on the Supabase database to create new nutrition and hydration plan tables

-- Drop existing nutrition-related tables if they exist
DROP TABLE IF EXISTS nutrition_plan_items CASCADE;
DROP TABLE IF EXISTS nutrition_plans CASCADE;
DROP TABLE IF EXISTS nutrition_items CASCADE;

-- 1. Create NutritionPlan model
CREATE TABLE nutrition_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  race_type TEXT,
  race_duration INTERVAL,
  terrain_type TEXT,
  weather_condition TEXT,
  intensity_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create NutritionEntry model
CREATE TABLE nutrition_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES nutrition_plans(id) ON DELETE CASCADE NOT NULL,
  food_type TEXT NOT NULL,
  calories INTEGER,
  carbs INTEGER,
  protein INTEGER,
  fat INTEGER,
  timing TEXT,
  frequency TEXT,
  quantity INTEGER,
  sodium INTEGER,
  potassium INTEGER,
  magnesium INTEGER,
  is_essential BOOLEAN DEFAULT FALSE,
  source_location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create HydrationPlan model
CREATE TABLE hydration_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  race_type TEXT,
  race_duration INTERVAL,
  terrain_type TEXT,
  weather_condition TEXT,
  intensity_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create HydrationEntry model
CREATE TABLE hydration_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id UUID REFERENCES hydration_plans(id) ON DELETE CASCADE NOT NULL,
  liquid_type TEXT NOT NULL,
  volume INTEGER,
  electrolytes JSONB,
  timing TEXT,
  frequency TEXT,
  consumption_rate INTEGER,
  temperature TEXT,
  source_location TEXT,
  container_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create RacePlan junction model
CREATE TABLE race_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  nutrition_plan_id UUID REFERENCES nutrition_plans(id) ON DELETE SET NULL,
  hydration_plan_id UUID REFERENCES hydration_plans(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX nutrition_plans_user_id_idx ON nutrition_plans(user_id);
CREATE INDEX nutrition_entries_plan_id_idx ON nutrition_entries(plan_id);
CREATE INDEX hydration_plans_user_id_idx ON hydration_plans(user_id);
CREATE INDEX hydration_entries_plan_id_idx ON hydration_entries(plan_id);
CREATE INDEX race_plans_race_id_idx ON race_plans(race_id);
CREATE INDEX race_plans_nutrition_plan_id_idx ON race_plans(nutrition_plan_id);
CREATE INDEX race_plans_hydration_plan_id_idx ON race_plans(hydration_plan_id);

-- Set up Row Level Security (RLS)
ALTER TABLE nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for nutrition_plans
CREATE POLICY "Users can view their own nutrition plans" 
  ON nutrition_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition plans" 
  ON nutrition_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition plans" 
  ON nutrition_plans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nutrition plans" 
  ON nutrition_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for nutrition_entries
CREATE POLICY "Users can view their own nutrition entries" 
  ON nutrition_entries FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM nutrition_plans 
    WHERE nutrition_plans.id = nutrition_entries.plan_id 
    AND nutrition_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own nutrition entries" 
  ON nutrition_entries FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM nutrition_plans 
    WHERE nutrition_plans.id = nutrition_entries.plan_id 
    AND nutrition_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own nutrition entries" 
  ON nutrition_entries FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM nutrition_plans 
    WHERE nutrition_plans.id = nutrition_entries.plan_id 
    AND nutrition_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own nutrition entries" 
  ON nutrition_entries FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM nutrition_plans 
    WHERE nutrition_plans.id = nutrition_entries.plan_id 
    AND nutrition_plans.user_id = auth.uid()
  ));

-- Create policies for hydration_plans
CREATE POLICY "Users can view their own hydration plans" 
  ON hydration_plans FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own hydration plans" 
  ON hydration_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hydration plans" 
  ON hydration_plans FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hydration plans" 
  ON hydration_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- Create policies for hydration_entries
CREATE POLICY "Users can view their own hydration entries" 
  ON hydration_entries FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM hydration_plans 
    WHERE hydration_plans.id = hydration_entries.plan_id 
    AND hydration_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own hydration entries" 
  ON hydration_entries FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM hydration_plans 
    WHERE hydration_plans.id = hydration_entries.plan_id 
    AND hydration_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own hydration entries" 
  ON hydration_entries FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM hydration_plans 
    WHERE hydration_plans.id = hydration_entries.plan_id 
    AND hydration_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own hydration entries" 
  ON hydration_entries FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM hydration_plans 
    WHERE hydration_plans.id = hydration_entries.plan_id 
    AND hydration_plans.user_id = auth.uid()
  ));

-- Create policies for race_plans
CREATE POLICY "Users can view their own race plans" 
  ON race_plans FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM races 
    WHERE races.id = race_plans.race_id 
    AND races.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own race plans" 
  ON race_plans FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM races 
    WHERE races.id = race_plans.race_id 
    AND races.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own race plans" 
  ON race_plans FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM races 
    WHERE races.id = race_plans.race_id 
    AND races.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own race plans" 
  ON race_plans FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM races 
    WHERE races.id = race_plans.race_id 
    AND races.user_id = auth.uid()
  ));

-- Create triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_nutrition_plans_modtime
BEFORE UPDATE ON nutrition_plans
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_nutrition_entries_modtime
BEFORE UPDATE ON nutrition_entries
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_hydration_plans_modtime
BEFORE UPDATE ON hydration_plans
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_hydration_entries_modtime
BEFORE UPDATE ON hydration_entries
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_race_plans_modtime
BEFORE UPDATE ON race_plans
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();