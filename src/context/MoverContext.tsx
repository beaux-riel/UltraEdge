/**
 * UltraEdge Mover Context
 * Local state management for Mover profile with AsyncStorage persistence
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runLocalPlanOperation, commitPlanWrites, readArray } from '../lib/localPlanStorage';
import type { DistanceUnit, ElevationUnit, WeightUnit } from '../lib/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface WeightEntry {
  id: string;
  weight: number;
  weight_unit: WeightUnit;
  recorded_at: string;
  notes?: string;
}

export interface MoverProfile {
  display_name: string;
  current_weight: number | null;
  weight_unit: WeightUnit;
  distance_unit: DistanceUnit;
  elevation_unit: ElevationUnit;
  weight_updated_at: string | null;
}

export interface MoverContextType {
  profile: MoverProfile;
  weightHistory: WeightEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Profile actions
  updateProfile: (updates: Partial<MoverProfile>) => Promise<void>;
  
  // Weight actions
  logWeight: (weight: number, notes?: string) => Promise<void>;
  deleteWeightEntry: (id: string) => Promise<void>;
  
  // Weight calculations
  getWeightTrend: () => { direction: 'up' | 'down' | 'stable'; change: number; percentChange: number } | null;
  getWeightHistory30Days: () => WeightEntry[];
  
  // Refresh
  refreshData: () => Promise<void>;
}

// ============================================================================
// STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  PROFILE: '@ultraedge:mover_profile',
  WEIGHT_HISTORY: '@ultraedge:weight_history',
};

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const DEFAULT_PROFILE: MoverProfile = {
  display_name: 'Mover',
  current_weight: null,
  weight_unit: 'lbs',
  distance_unit: 'miles',
  elevation_unit: 'feet',
  weight_updated_at: null,
};

// ============================================================================
// CONTEXT
// ============================================================================

const MoverContext = createContext<MoverContextType | undefined>(undefined);

export const convertMoverWeight = (weight: number, from: WeightUnit, to: WeightUnit) => {
  const grams = { lbs: 453.59237, kg: 1000, oz: 28.349523125, g: 1 };
  return weight * grams[from] / grams[to];
};

async function readMoverData() {
  const raw = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
  const saved = raw === null ? DEFAULT_PROFILE : JSON.parse(raw);
  if (!saved || typeof saved !== 'object' || Array.isArray(saved) ||
      typeof saved.display_name !== 'string' || !['lbs', 'kg', 'oz', 'g'].includes(saved.weight_unit) ||
      !['miles', 'kilometers'].includes(saved.distance_unit) || !['feet', 'meters'].includes(saved.elevation_unit) ||
      (saved.current_weight !== null && (!Number.isFinite(saved.current_weight) || saved.current_weight <= 0))) {
    throw new Error('Saved profile data is invalid.');
  }
  const history = await readArray<WeightEntry>(STORAGE_KEYS.WEIGHT_HISTORY);
  if (!history.every(entry => entry && typeof entry.id === 'string' && Number.isFinite(entry.weight) &&
      entry.weight > 0 && ['lbs', 'kg', 'oz', 'g'].includes(entry.weight_unit) && Number.isFinite(Date.parse(entry.recorded_at)))) {
    throw new Error('Saved weight history is invalid.');
  }
  return { profile: saved as MoverProfile, history: history.sort((a, b) => Date.parse(b.recorded_at) - Date.parse(a.recorded_at)) };
}

export function MoverProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<MoverProfile>(DEFAULT_PROFILE);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);

  const applyData = (data: Awaited<ReturnType<typeof readMoverData>>) => {
    setProfile(data.profile);
    setWeightHistory(data.history);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await runLocalPlanOperation(async () => {
        const data = await readMoverData();
        applyData(data);
        loaded.current = true;
        setError(null);
      });
    } catch {
      loaded.current = false;
      setError('Profile and weight history could not be loaded. Your saved data has been preserved. Retry before editing.');
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const changeData = useCallback(async (change: (data: Awaited<ReturnType<typeof readMoverData>>) => void) => {
    if (!loaded.current) throw new Error('Load your profile and weight history before editing.');
    try {
      await runLocalPlanOperation(async () => {
        if (!loaded.current) throw new Error('Reload your profile before editing.');
        const data = await readMoverData();
        change(data);
        await commitPlanWrites([
          [STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(data.history)],
          [STORAGE_KEYS.PROFILE, JSON.stringify(data.profile)],
        ]);
        applyData(data);
        setError(null);
      });
    } catch (failure) {
      // A durable journal may be awaiting recovery. Require a refresh so retrying
      // an interrupted weight log cannot silently add the same entry twice.
      loaded.current = false;
      setError('The save could not be confirmed. Retry loading to recover any pending save before editing again.');
      throw failure;
    }
  }, []);

  const updateProfile = useCallback((updates: Partial<MoverProfile>) => changeData(data => {
    const next = { ...data.profile, ...updates };
    if (next.weight_unit !== data.profile.weight_unit && data.profile.current_weight !== null) {
      next.current_weight = convertMoverWeight(data.profile.current_weight, data.profile.weight_unit, next.weight_unit);
    }
    data.profile = next;
  }), [changeData]);

  const logWeight = useCallback((weight: number, notes?: string) => {
    if (!Number.isFinite(weight) || weight <= 0) return Promise.reject(new Error('Enter a valid weight greater than zero.'));
    return changeData(data => {
      const now = new Date().toISOString();
      const entry: WeightEntry = {
        id: `weight_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        weight, weight_unit: data.profile.weight_unit, recorded_at: now, notes,
      };
      data.history = [entry, ...data.history];
      data.profile = { ...data.profile, current_weight: weight, weight_updated_at: now };
    });
  }, [changeData]);

  const deleteWeightEntry = useCallback((id: string) => changeData(data => {
    data.history = data.history.filter(entry => entry.id !== id);
    const latest = data.history[0];
    data.profile = { ...data.profile,
      current_weight: latest ? convertMoverWeight(latest.weight, latest.weight_unit, data.profile.weight_unit) : null,
      weight_updated_at: latest?.recorded_at ?? null,
    };
  }), [changeData]);

  // ---------------------------------------------------------------------------
  // Calculate weight trend (compare last 7 days to previous 7 days)
  // ---------------------------------------------------------------------------
  const getWeightTrend = useCallback(() => {
    const normalizedHistory = weightHistory.map(entry => ({ ...entry, weight: convertMoverWeight(entry.weight, entry.weight_unit, profile.weight_unit) }));
    if (normalizedHistory.length < 2) return null;
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Get entries from last 7 days and previous 7 days
    const recentEntries = normalizedHistory.filter(e => new Date(e.recorded_at) >= sevenDaysAgo);
    const previousEntries = normalizedHistory.filter(e => {
      const date = new Date(e.recorded_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });
    
    // If we don't have entries in both periods, just compare most recent to previous
    if (recentEntries.length === 0 || previousEntries.length === 0) {
      if (weightHistory.length >= 2) {
        const current = normalizedHistory[0].weight;
        const previous = normalizedHistory[1].weight;
        const change = current - previous;
        const percentChange = (change / previous) * 100;
        
        return {
          direction: (change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
          change: Math.abs(change),
          percentChange: Math.abs(percentChange),
        };
      }
      return null;
    }
    
    // Calculate averages
    const recentAvg = recentEntries.reduce((sum, e) => sum + e.weight, 0) / recentEntries.length;
    const previousAvg = previousEntries.reduce((sum, e) => sum + e.weight, 0) / previousEntries.length;
    
    const change = recentAvg - previousAvg;
    const percentChange = (change / previousAvg) * 100;
    
    return {
      direction: (change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable') as 'up' | 'down' | 'stable',
      change: Math.abs(change),
      percentChange: Math.abs(percentChange),
    };
  }, [weightHistory, profile.weight_unit]);

  // ---------------------------------------------------------------------------
  // Get weight history for last 30 days
  // ---------------------------------------------------------------------------
  const getWeightHistory30Days = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return weightHistory
      .map(entry => ({ ...entry, weight: convertMoverWeight(entry.weight, entry.weight_unit, profile.weight_unit), weight_unit: profile.weight_unit }))
      .filter(entry => new Date(entry.recorded_at) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  }, [weightHistory, profile.weight_unit]);

  // ---------------------------------------------------------------------------
  // Refresh data
  // ---------------------------------------------------------------------------
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Context value
  // ---------------------------------------------------------------------------
  const value: MoverContextType = {
    profile,
    weightHistory,
    isLoading,
    error,
    updateProfile,
    logWeight,
    deleteWeightEntry,
    getWeightTrend,
    getWeightHistory30Days,
    refreshData,
  };

  return (
    <MoverContext.Provider value={value}>
      {children}
    </MoverContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useMover() {
  const context = useContext(MoverContext);
  if (context === undefined) {
    throw new Error('useMover must be used within a MoverProvider');
  }
  return context;
}

export default MoverContext;
