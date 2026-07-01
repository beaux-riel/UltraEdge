/**
 * UltraEdge Database Types
 * Generated from schema.sql - keep in sync
 * 
 * Usage: Import these types in your React Native app
 * Supabase CLI can also generate these: `supabase gen types typescript`
 */

// =============================================================================
// ENUMS
// =============================================================================

export type EventStatus = 'draft' | 'planning' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
export type DistanceUnit = 'miles' | 'kilometers';
export type WeightUnit = 'lbs' | 'kg' | 'oz' | 'g';
export type ElevationUnit = 'feet' | 'meters';
export type CheckpointType = 'start' | 'aid_station' | 'crew_access' | 'drop_bag' | 'gear_check' | 'timing' | 'finish' | 'other';
export type GearCategory = 'footwear' | 'clothing' | 'pack' | 'hydration' | 'lighting' | 'navigation' | 'safety' | 'poles' | 'other';
export type NutritionType = 'gel' | 'bar' | 'chew' | 'drink_mix' | 'real_food' | 'hydration' | 'electrolyte' | 'caffeine' | 'other';

// =============================================================================
// DATABASE TABLES
// =============================================================================

export interface Mover {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  current_weight: number | null;
  weight_unit: WeightUnit;
  weight_updated_at: string | null;
  distance_unit: DistanceUnit;
  elevation_unit: ElevationUnit;
  timezone: string;
  is_premium: boolean;
  premium_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  mover_id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  start_location: string | null;
  finish_location: string | null;
  total_distance: number | null;
  distance_unit: DistanceUnit;
  total_elevation_gain: number | null;
  total_elevation_loss: number | null;
  elevation_unit: ElevationUnit;
  cutoff_time: string | null; // PostgreSQL interval as string
  target_time: string | null;
  status: EventStatus;
  mover_weight_snapshot: number | null;
  total_gear_weight: number | null;
  total_nutrition_weight: number | null;
  total_hydration_weight: number | null;
  race_website: string | null;
  course_map_url: string | null;
  gpx_file_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Checkpoint {
  id: string;
  event_id: string;
  name: string;
  checkpoint_type: CheckpointType;
  order_index: number;
  distance_from_start: number | null;
  elevation: number | null;
  location_description: string | null;
  latitude: number | null;
  longitude: number | null;
  cutoff_time: string | null;
  cutoff_duration: string | null;
  estimated_arrival: string | null;
  estimated_duration: string | null;
  has_crew_access: boolean;
  has_drop_bag: boolean;
  has_pacer_pickup: boolean;
  has_pacer_dropoff: boolean;
  aid_supplies: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GearItem {
  id: string;
  mover_id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: GearCategory;
  weight: number | null;
  weight_unit: WeightUnit;
  color: string | null;
  size: string | null;
  notes: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventGear {
  id: string;
  event_id: string;
  gear_item_id: string;
  is_worn: boolean;
  is_carried: boolean;
  quantity: number;
  notes: string | null;
  created_at: string;
}

export interface DropBag {
  id: string;
  event_id: string;
  checkpoint_id: string;
  name: string | null;
  color: string | null;
  total_weight: number | null;
  weight_unit: WeightUnit;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DropBagItem {
  id: string;
  drop_bag_id: string;
  gear_item_id: string | null;
  name: string | null;
  category: string | null;
  quantity: number;
  weight: number | null;
  weight_unit: WeightUnit;
  notes: string | null;
  created_at: string;
}

export interface CrewMember {
  id: string;
  mover_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  notes: string | null;
  avatar_url: string | null;
  linked_mover_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrewAssignment {
  id: string;
  event_id: string;
  checkpoint_id: string;
  crew_member_id: string;
  is_pacer: boolean;
  is_crew: boolean;
  arrival_instructions: string | null;
  what_to_bring: string | null;
  driving_directions_url: string | null;
  parking_notes: string | null;
  notes: string | null;
  created_at: string;
}

export interface NutritionItem {
  id: string;
  mover_id: string;
  name: string;
  brand: string | null;
  nutrition_type: NutritionType;
  flavor: string | null;
  calories: number | null;
  carbs_g: number | null;
  sodium_mg: number | null;
  caffeine_mg: number | null;
  weight: number | null;
  weight_unit: WeightUnit;
  volume_ml: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventNutrition {
  id: string;
  event_id: string;
  nutrition_item_id: string | null;
  name: string | null;
  checkpoint_id: string | null;
  segment_start_checkpoint_id: string | null;
  segment_end_checkpoint_id: string | null;
  quantity: number;
  is_carried: boolean;
  is_from_drop_bag: boolean;
  is_from_crew: boolean;
  is_from_aid: boolean;
  notes: string | null;
  created_at: string;
}

export interface WeightHistory {
  id: string;
  mover_id: string;
  weight: number;
  weight_unit: WeightUnit;
  recorded_at: string;
  notes: string | null;
}

// =============================================================================
// JOIN TYPES (Common queries)
// =============================================================================

export interface CheckpointWithDetails extends Checkpoint {
  drop_bag?: DropBag & { items: DropBagItem[] };
  crew_assignments?: (CrewAssignment & { crew_member: CrewMember })[];
}

export interface EventWithDetails extends Event {
  checkpoints: CheckpointWithDetails[];
  gear: (EventGear & { gear_item: GearItem })[];
  nutrition: (EventNutrition & { nutrition_item: NutritionItem | null })[];
}

export interface EventWeightBreakdown {
  mover_weight: number | null;
  gear_weight: number;
  nutrition_weight: number;
  hydration_weight: number;
  total_weight: number;
}

// =============================================================================
// INSERT TYPES (For creating new records)
// =============================================================================

export type MoverInsert = Omit<Mover, 'id' | 'created_at' | 'updated_at'>;
export type EventInsert = Omit<Event, 'id' | 'created_at' | 'updated_at'>;
export type CheckpointInsert = Omit<Checkpoint, 'id' | 'created_at' | 'updated_at'>;
export type GearItemInsert = Omit<GearItem, 'id' | 'created_at' | 'updated_at'>;
export type EventGearInsert = Omit<EventGear, 'id' | 'created_at'>;
export type DropBagInsert = Omit<DropBag, 'id' | 'created_at' | 'updated_at'>;
export type DropBagItemInsert = Omit<DropBagItem, 'id' | 'created_at'>;
export type CrewMemberInsert = Omit<CrewMember, 'id' | 'created_at' | 'updated_at'>;
export type CrewAssignmentInsert = Omit<CrewAssignment, 'id' | 'created_at'>;
export type NutritionItemInsert = Omit<NutritionItem, 'id' | 'created_at' | 'updated_at'>;
export type EventNutritionInsert = Omit<EventNutrition, 'id' | 'created_at'>;
export type WeightHistoryInsert = Omit<WeightHistory, 'id' | 'recorded_at'>;

// =============================================================================
// UPDATE TYPES (For partial updates)
// =============================================================================

export type MoverUpdate = Partial<MoverInsert>;
export type EventUpdate = Partial<EventInsert>;
export type CheckpointUpdate = Partial<CheckpointInsert>;
export type GearItemUpdate = Partial<GearItemInsert>;
export type EventGearUpdate = Partial<EventGearInsert>;
export type DropBagUpdate = Partial<DropBagInsert>;
export type DropBagItemUpdate = Partial<DropBagItemInsert>;
export type CrewMemberUpdate = Partial<CrewMemberInsert>;
export type CrewAssignmentUpdate = Partial<CrewAssignmentInsert>;
export type NutritionItemUpdate = Partial<NutritionItemInsert>;
export type EventNutritionUpdate = Partial<EventNutritionInsert>;

// =============================================================================
// SUPABASE DATABASE TYPE (For client initialization)
// =============================================================================

export interface Database {
  public: {
    Tables: {
      movers: {
        Row: Mover;
        Insert: MoverInsert;
        Update: MoverUpdate;
      };
      events: {
        Row: Event;
        Insert: EventInsert;
        Update: EventUpdate;
      };
      checkpoints: {
        Row: Checkpoint;
        Insert: CheckpointInsert;
        Update: CheckpointUpdate;
      };
      gear_items: {
        Row: GearItem;
        Insert: GearItemInsert;
        Update: GearItemUpdate;
      };
      event_gear: {
        Row: EventGear;
        Insert: EventGearInsert;
        Update: EventGearUpdate;
      };
      drop_bags: {
        Row: DropBag;
        Insert: DropBagInsert;
        Update: DropBagUpdate;
      };
      drop_bag_items: {
        Row: DropBagItem;
        Insert: DropBagItemInsert;
        Update: DropBagItemUpdate;
      };
      crew_members: {
        Row: CrewMember;
        Insert: CrewMemberInsert;
        Update: CrewMemberUpdate;
      };
      crew_assignments: {
        Row: CrewAssignment;
        Insert: CrewAssignmentInsert;
        Update: CrewAssignmentUpdate;
      };
      nutrition_items: {
        Row: NutritionItem;
        Insert: NutritionItemInsert;
        Update: NutritionItemUpdate;
      };
      event_nutrition: {
        Row: EventNutrition;
        Insert: EventNutritionInsert;
        Update: EventNutritionUpdate;
      };
      weight_history: {
        Row: WeightHistory;
        Insert: WeightHistoryInsert;
        Update: Partial<WeightHistoryInsert>;
      };
    };
    Functions: {
      calculate_event_weight: {
        Args: { p_event_id: string };
        Returns: EventWeightBreakdown;
      };
    };
    Enums: {
      event_status: EventStatus;
      distance_unit: DistanceUnit;
      weight_unit: WeightUnit;
      elevation_unit: ElevationUnit;
      checkpoint_type: CheckpointType;
      gear_category: GearCategory;
      nutrition_type: NutritionType;
    };
  };
}
