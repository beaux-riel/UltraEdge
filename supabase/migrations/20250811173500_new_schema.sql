-- Migration: Complete schema replacement
-- Description: Replacing the entire schema with a new structure based on updated requirements

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS course_notes;
DROP TABLE IF EXISTS nutrition_plan_items;
DROP TABLE IF EXISTS nutrition_plans;
DROP TABLE IF EXISTS nutrition_items;
DROP TABLE IF EXISTS pacer_gear;
DROP TABLE IF EXISTS race_gear;
DROP TABLE IF EXISTS gear_items;
DROP TABLE IF EXISTS race_drop_bags;
DROP TABLE IF EXISTS drop_bag_templates;
DROP TABLE IF EXISTS aid_station_crew;
DROP TABLE IF EXISTS race_crew;
DROP TABLE IF EXISTS crew_members;
DROP TABLE IF EXISTS aid_station_checkins;
DROP TABLE IF EXISTS aid_stations;
DROP TABLE IF EXISTS races;
DROP TABLE IF EXISTS race_backups;
DROP TABLE IF EXISTS profiles;

-- Create new schema based on the provided requirements

-- Core Entities

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  age INTEGER,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AthleteProfiles table
CREATE TABLE athlete_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  location VARCHAR(255),
  preferred_activity_type VARCHAR(100),
  hourly_calorie_consumption INTEGER,
  carry_limit INTEGER, -- weight limit in grams
  preferred_aid_station_rest_duration INTEGER, -- minutes
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  medical_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) CHECK (type IN ('marathon', 'ultramarathon', 'triathlon', 'adventure_race', 'other')),
  start_date_time TIMESTAMP WITH TIME ZONE,
  end_date_time TIMESTAMP WITH TIME ZONE,
  total_distance INTEGER, -- meters
  elevation_gain INTEGER, -- meters
  location VARCHAR(255),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  registration_url VARCHAR(255),
  mandatory_gear_list JSONB,
  race_director_contact VARCHAR(255),
  status VARCHAR(50) CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AidStations table
CREATE TABLE aid_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  station_type VARCHAR(50) CHECK (station_type IN ('minor', 'major', 'marshall', 'start', 'finish', 'medical')),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  elevation INTEGER, -- meters
  facilities JSONB, -- {washrooms: boolean, medical: boolean, water: boolean, food: boolean}
  accessibility_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event-Specific Relationships

-- EventAidStations table
CREATE TABLE event_aid_stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  aid_station_id UUID REFERENCES aid_stations(id) ON DELETE CASCADE NOT NULL,
  distance_from_start INTEGER, -- meters
  cutoff_date_time TIMESTAMP WITH TIME ZONE,
  cutoff_duration_minutes INTEGER,
  max_rest_duration_minutes INTEGER,
  sequence_order INTEGER, -- for ordering aid stations along course
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crew table
CREATE TABLE crew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  skills JSONB, -- JSON array: ["medical", "nutrition", "logistics", etc.]
  availability TEXT,
  emergency_contact VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EventCrew table
CREATE TABLE event_crew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  crew_id UUID REFERENCES crew(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) CHECK (role IN ('crew_chief', 'medical', 'nutrition', 'logistics', 'general')),
  start_date_time TIMESTAMP WITH TIME ZONE,
  end_date_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AidStationCrew table
CREATE TABLE aid_station_crew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_aid_station_id UUID REFERENCES event_aid_stations(id) ON DELETE CASCADE NOT NULL,
  event_crew_id UUID REFERENCES event_crew(id) ON DELETE CASCADE NOT NULL,
  start_date_time TIMESTAMP WITH TIME ZONE,
  end_date_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items and Inventory Management

-- Items table
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) CHECK (category IN ('gear', 'nutrition', 'hydration', 'medical', 'safety')),
  subcategory VARCHAR(100), -- headlamp, energy_gel, electrolyte, etc.
  weight INTEGER, -- grams
  volume INTEGER, -- ml - for liquids
  is_consumable BOOLEAN DEFAULT FALSE,
  runtime_minutes INTEGER, -- for items with finite use time
  unit_of_measure VARCHAR(50) CHECK (unit_of_measure IN ('piece', 'ml', 'gram', 'serving')),
  storage_instructions TEXT,
  expiration_tracking BOOLEAN DEFAULT FALSE,
  cost DECIMAL(10, 2), -- for inventory valuation
  supplier VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UserItems table (User's Personal Inventory)
CREATE TABLE user_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  total_quantity INTEGER NOT NULL,
  available_quantity INTEGER NOT NULL,
  reserved_quantity INTEGER NOT NULL, -- allocated to events but not consumed
  unit_cost DECIMAL(10, 2),
  purchase_date DATE,
  expiration_date DATE,
  condition VARCHAR(50) CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ItemRequirements table
CREATE TABLE item_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  primary_item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  required_item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  required_quantity INTEGER NOT NULL,
  required_unit_of_measure VARCHAR(50),
  relationship_type VARCHAR(50) CHECK (relationship_type IN ('requires', 'pairs_with', 'enhances')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dropbag System

-- Dropbags table
CREATE TABLE dropbags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_template BOOLEAN DEFAULT FALSE,
  template_category VARCHAR(100), -- for organizing templates
  max_weight INTEGER, -- grams
  color VARCHAR(50), -- for physical identification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EventDropbags table (Event-specific dropbag instances)
CREATE TABLE event_dropbags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  dropbag_id UUID REFERENCES dropbags(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('planned', 'packed', 'deployed', 'retrieved')),
  actual_weight INTEGER, -- grams
  packing_notes TEXT,
  deployment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DropbagItems table
CREATE TABLE dropbag_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_dropbag_id UUID REFERENCES event_dropbags(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  planned_quantity INTEGER NOT NULL,
  actual_quantity INTEGER, -- what was actually packed
  is_mandatory BOOLEAN DEFAULT FALSE,
  consumed_quantity INTEGER DEFAULT 0, -- tracked during event
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DropbagDeployments table
CREATE TABLE dropbag_deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_dropbag_id UUID REFERENCES event_dropbags(id) ON DELETE CASCADE NOT NULL,
  event_aid_station_id UUID REFERENCES event_aid_stations(id) ON DELETE CASCADE NOT NULL,
  deployment_date_time TIMESTAMP WITH TIME ZONE,
  retrieval_date_time TIMESTAMP WITH TIME ZONE,
  deployed_by UUID REFERENCES event_crew(id) ON DELETE SET NULL,
  retrieved_by UUID REFERENCES event_crew(id) ON DELETE SET NULL,
  status VARCHAR(50) CHECK (status IN ('deployed', 'accessed', 'retrieved', 'lost')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consumption and Performance Tracking

-- EventConsumption table
CREATE TABLE event_consumption (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  event_aid_station_id UUID REFERENCES event_aid_stations(id) ON DELETE SET NULL,
  event_dropbag_id UUID REFERENCES event_dropbags(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  consumption_date_time TIMESTAMP WITH TIME ZONE,
  consumption_type VARCHAR(50) CHECK (consumption_type IN ('planned', 'actual')),
  effectiveness VARCHAR(50) CHECK (effectiveness IN ('very_helpful', 'helpful', 'neutral', 'unhelpful')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AthleteEventPerformance table
CREATE TABLE athlete_event_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) CHECK (status IN ('registered', 'started', 'finished', 'dnf', 'dsq')),
  start_date_time TIMESTAMP WITH TIME ZONE,
  finish_date_time TIMESTAMP WITH TIME ZONE,
  total_time_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AidStationVisits table
CREATE TABLE aid_station_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_event_performance_id UUID REFERENCES athlete_event_performance(id) ON DELETE CASCADE NOT NULL,
  event_aid_station_id UUID REFERENCES event_aid_stations(id) ON DELETE CASCADE NOT NULL,
  arrival_date_time TIMESTAMP WITH TIME ZONE,
  departure_date_time TIMESTAMP WITH TIME ZONE,
  rest_duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support and Performance Tracking

-- Pacers table
CREATE TABLE pacers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  athlete_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- the athlete being paced
  pacer_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- the person doing the pacing
  start_aid_station_id UUID REFERENCES event_aid_stations(id) ON DELETE CASCADE NOT NULL, -- where pacing begins
  end_aid_station_id UUID REFERENCES event_aid_stations(id) ON DELETE SET NULL, -- where pacing ends (nullable for full race)
  status VARCHAR(50) CHECK (status IN ('registered', 'active', 'completed', 'dnf', 'withdrawn')),
  start_date_time TIMESTAMP WITH TIME ZONE,
  end_date_time TIMESTAMP WITH TIME ZONE,
  total_time_minutes INTEGER,
  pacing_notes TEXT,
  emergency_contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SupportVehicles table
CREATE TABLE support_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  athlete_user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, -- athlete being supported
  vehicle_type VARCHAR(50) CHECK (vehicle_type IN ('car', 'van', 'bike', 'atv', 'other')),
  license_plate VARCHAR(50),
  status VARCHAR(50) CHECK (status IN ('registered', 'active', 'completed', 'withdrawn')),
  start_location VARCHAR(255),
  current_latitude DECIMAL(10, 7),
  current_longitude DECIMAL(10, 7),
  last_location_update TIMESTAMP WITH TIME ZONE,
  driver_event_crew_id UUID REFERENCES event_crew(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SupportVehicleCrew table
CREATE TABLE support_vehicle_crew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_vehicle_id UUID REFERENCES support_vehicles(id) ON DELETE CASCADE NOT NULL,
  event_crew_id UUID REFERENCES event_crew(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) CHECK (role IN ('driver', 'navigator', 'crew_chief', 'support')),
  start_date_time TIMESTAMP WITH TIME ZONE,
  end_date_time TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AthleteKits table (Starting/Carrying Gear)
CREATE TABLE athlete_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  kit_type VARCHAR(50) CHECK (kit_type IN ('starting_gear', 'mandatory_gear', 'carried_nutrition', 'carried_hydration')),
  total_weight INTEGER, -- grams
  status VARCHAR(50) CHECK (status IN ('planned', 'packed', 'race_ready', 'post_race')),
  packing_date_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AthleteKitItems table
CREATE TABLE athlete_kit_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_kit_id UUID REFERENCES athlete_kits(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  is_mandatory BOOLEAN DEFAULT FALSE,
  item_condition VARCHAR(50) CHECK (item_condition IN ('new', 'good', 'fair', 'poor')),
  consumed_quantity INTEGER DEFAULT 0, -- for nutrition/hydration tracking
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SupportVehicleInventory table
CREATE TABLE support_vehicle_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  support_vehicle_id UUID REFERENCES support_vehicles(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  consumed_quantity INTEGER DEFAULT 0,
  restock_location VARCHAR(255), -- where item was added to vehicle
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_athlete_profiles_user_id ON athlete_profiles(user_id);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_event_aid_stations_event_id ON event_aid_stations(event_id);
CREATE INDEX idx_event_aid_stations_aid_station_id ON event_aid_stations(aid_station_id);
CREATE INDEX idx_event_crew_event_id ON event_crew(event_id);
CREATE INDEX idx_event_crew_crew_id ON event_crew(crew_id);
CREATE INDEX idx_aid_station_crew_event_aid_station_id ON aid_station_crew(event_aid_station_id);
CREATE INDEX idx_aid_station_crew_event_crew_id ON aid_station_crew(event_crew_id);
CREATE INDEX idx_user_items_user_id ON user_items(user_id);
CREATE INDEX idx_user_items_item_id ON user_items(item_id);
CREATE INDEX idx_item_requirements_primary_item_id ON item_requirements(primary_item_id);
CREATE INDEX idx_item_requirements_required_item_id ON item_requirements(required_item_id);
CREATE INDEX idx_dropbags_user_id ON dropbags(user_id);
CREATE INDEX idx_event_dropbags_event_id ON event_dropbags(event_id);
CREATE INDEX idx_event_dropbags_dropbag_id ON event_dropbags(dropbag_id);
CREATE INDEX idx_event_dropbags_user_id ON event_dropbags(user_id);
CREATE INDEX idx_dropbag_items_event_dropbag_id ON dropbag_items(event_dropbag_id);
CREATE INDEX idx_dropbag_items_item_id ON dropbag_items(item_id);
CREATE INDEX idx_dropbag_deployments_event_dropbag_id ON dropbag_deployments(event_dropbag_id);
CREATE INDEX idx_dropbag_deployments_event_aid_station_id ON dropbag_deployments(event_aid_station_id);
CREATE INDEX idx_event_consumption_event_id ON event_consumption(event_id);
CREATE INDEX idx_event_consumption_user_id ON event_consumption(user_id);
CREATE INDEX idx_event_consumption_item_id ON event_consumption(item_id);
CREATE INDEX idx_athlete_event_performance_event_id ON athlete_event_performance(event_id);
CREATE INDEX idx_athlete_event_performance_user_id ON athlete_event_performance(user_id);
CREATE INDEX idx_aid_station_visits_athlete_event_performance_id ON aid_station_visits(athlete_event_performance_id);
CREATE INDEX idx_aid_station_visits_event_aid_station_id ON aid_station_visits(event_aid_station_id);
CREATE INDEX idx_pacers_event_id ON pacers(event_id);
CREATE INDEX idx_pacers_athlete_user_id ON pacers(athlete_user_id);
CREATE INDEX idx_pacers_pacer_user_id ON pacers(pacer_user_id);
CREATE INDEX idx_support_vehicles_event_id ON support_vehicles(event_id);
CREATE INDEX idx_support_vehicles_athlete_user_id ON support_vehicles(athlete_user_id);
CREATE INDEX idx_support_vehicle_crew_support_vehicle_id ON support_vehicle_crew(support_vehicle_id);
CREATE INDEX idx_support_vehicle_crew_event_crew_id ON support_vehicle_crew(event_crew_id);
CREATE INDEX idx_athlete_kits_event_id ON athlete_kits(event_id);
CREATE INDEX idx_athlete_kits_user_id ON athlete_kits(user_id);
CREATE INDEX idx_athlete_kit_items_athlete_kit_id ON athlete_kit_items(athlete_kit_id);
CREATE INDEX idx_athlete_kit_items_item_id ON athlete_kit_items(item_id);
CREATE INDEX idx_support_vehicle_inventory_support_vehicle_id ON support_vehicle_inventory(support_vehicle_id);
CREATE INDEX idx_support_vehicle_inventory_item_id ON support_vehicle_inventory(item_id);

-- Set up Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_aid_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_station_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropbags ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_dropbags ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropbag_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropbag_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_event_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_station_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacers ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_vehicle_crew ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_vehicle_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    name, 
    email
  )
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();