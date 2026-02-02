/**
 * Supabase Client Configuration
 * 
 * Setup:
 * 1. Create .env file in app root with:
 *    EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
 *    EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
 * 
 * 2. Or set in app.config.js extra field
 */

// Polyfills for React Native
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from './database.types';

// Get from environment variables (Expo public env vars)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
  realtime: {
    params: {
      eventsPerSecond: 0, // Disable realtime subscriptions
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'ultraedge-mobile',
    },
  },
});

// ============================================================================
// AUTH HELPERS
// ============================================================================

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}

export async function getUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data.user, error };
}

// ============================================================================
// MOVER HELPERS
// ============================================================================

export async function getMover(userId: string) {
  const { data, error } = await supabase
    .from('movers')
    .select('*')
    .eq('user_id', userId)
    .single();
  return { mover: data, error };
}

export async function createMover(userId: string, displayName: string) {
  const { data, error } = await supabase
    .from('movers')
    .insert({
      user_id: userId,
      display_name: displayName,
    })
    .select()
    .single();
  return { mover: data, error };
}

export async function updateMoverWeight(moverId: string, weight: number, unit: string) {
  const { data, error } = await supabase
    .from('movers')
    .update({
      current_weight: weight,
      weight_unit: unit,
      weight_updated_at: new Date().toISOString(),
    })
    .eq('id', moverId)
    .select()
    .single();

  // Also log to weight history
  if (!error) {
    await supabase.from('weight_history').insert({
      mover_id: moverId,
      weight,
      weight_unit: unit,
    });
  }

  return { mover: data, error };
}

// ============================================================================
// EVENT HELPERS
// ============================================================================

export async function getEvents(moverId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('mover_id', moverId)
    .order('event_date', { ascending: true });
  return { events: data, error };
}

export async function getEventWithDetails(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      checkpoints (*),
      event_gear (*, gear_items (*)),
      drop_bags (*, drop_bag_items (*)),
      crew_assignments (*, crew_members (*)),
      event_nutrition (*, nutrition_items (*))
    `)
    .eq('id', eventId)
    .single();
  return { event: data, error };
}

export async function createEvent(moverId: string, eventData: Partial<Database['public']['Tables']['events']['Insert']>) {
  const { data, error } = await supabase
    .from('events')
    .insert({
      mover_id: moverId,
      ...eventData,
    })
    .select()
    .single();
  return { event: data, error };
}

// ============================================================================
// GEAR HELPERS
// ============================================================================

export async function getGearItems(moverId: string) {
  const { data, error } = await supabase
    .from('gear_items')
    .select('*')
    .eq('mover_id', moverId)
    .order('category', { ascending: true });
  return { gearItems: data, error };
}

export async function createGearItem(moverId: string, gearData: Partial<Database['public']['Tables']['gear_items']['Insert']>) {
  const { data, error } = await supabase
    .from('gear_items')
    .insert({
      mover_id: moverId,
      ...gearData,
    })
    .select()
    .single();
  return { gearItem: data, error };
}

// ============================================================================
// WEIGHT CALCULATION
// ============================================================================

export async function calculateEventWeight(eventId: string) {
  const { data, error } = await supabase.rpc('calculate_event_weight', {
    p_event_id: eventId,
  });
  return { weight: data, error };
}
