/**
 * UltraEdge Mover Context
 * Local state management for Mover profile with AsyncStorage persistence
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export function MoverProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<MoverProfile>(DEFAULT_PROFILE);
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------------------------
  // Load data from AsyncStorage
  // ---------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load profile
      const storedProfile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      }
      
      // Load weight history
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_HISTORY);
      if (storedHistory) {
        setWeightHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Error loading mover data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------------------------------------------------------------------------
  // Save profile to AsyncStorage
  // ---------------------------------------------------------------------------
  const saveProfile = async (newProfile: MoverProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  // ---------------------------------------------------------------------------
  // Save weight history to AsyncStorage
  // ---------------------------------------------------------------------------
  const saveWeightHistory = async (history: WeightEntry[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving weight history:', error);
      throw error;
    }
  };

  // ---------------------------------------------------------------------------
  // Update profile
  // ---------------------------------------------------------------------------
  const updateProfile = useCallback(async (updates: Partial<MoverProfile>) => {
    const newProfile = { ...profile, ...updates };
    setProfile(newProfile);
    await saveProfile(newProfile);
  }, [profile]);

  // ---------------------------------------------------------------------------
  // Log new weight entry
  // ---------------------------------------------------------------------------
  const logWeight = useCallback(async (weight: number, notes?: string) => {
    const now = new Date().toISOString();
    
    const newEntry: WeightEntry = {
      id: `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      weight,
      weight_unit: profile.weight_unit,
      recorded_at: now,
      notes,
    };
    
    // Add to history (newest first)
    const newHistory = [newEntry, ...weightHistory];
    setWeightHistory(newHistory);
    await saveWeightHistory(newHistory);
    
    // Update current weight in profile
    const updatedProfile = {
      ...profile,
      current_weight: weight,
      weight_updated_at: now,
    };
    setProfile(updatedProfile);
    await saveProfile(updatedProfile);
  }, [profile, weightHistory]);

  // ---------------------------------------------------------------------------
  // Delete weight entry
  // ---------------------------------------------------------------------------
  const deleteWeightEntry = useCallback(async (id: string) => {
    const newHistory = weightHistory.filter(entry => entry.id !== id);
    setWeightHistory(newHistory);
    await saveWeightHistory(newHistory);
    
    // Update current weight if we deleted the most recent entry
    if (newHistory.length > 0) {
      const mostRecent = newHistory[0];
      const updatedProfile = {
        ...profile,
        current_weight: mostRecent.weight,
        weight_updated_at: mostRecent.recorded_at,
      };
      setProfile(updatedProfile);
      await saveProfile(updatedProfile);
    } else {
      const updatedProfile = {
        ...profile,
        current_weight: null,
        weight_updated_at: null,
      };
      setProfile(updatedProfile);
      await saveProfile(updatedProfile);
    }
  }, [profile, weightHistory]);

  // ---------------------------------------------------------------------------
  // Calculate weight trend (compare last 7 days to previous 7 days)
  // ---------------------------------------------------------------------------
  const getWeightTrend = useCallback(() => {
    if (weightHistory.length < 2) return null;
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Get entries from last 7 days and previous 7 days
    const recentEntries = weightHistory.filter(e => new Date(e.recorded_at) >= sevenDaysAgo);
    const previousEntries = weightHistory.filter(e => {
      const date = new Date(e.recorded_at);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    });
    
    // If we don't have entries in both periods, just compare most recent to previous
    if (recentEntries.length === 0 || previousEntries.length === 0) {
      if (weightHistory.length >= 2) {
        const current = weightHistory[0].weight;
        const previous = weightHistory[1].weight;
        const change = current - previous;
        const percentChange = (change / previous) * 100;
        
        return {
          direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable',
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
      direction: change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'stable' as const,
      change: Math.abs(change),
      percentChange: Math.abs(percentChange),
    };
  }, [weightHistory]);

  // ---------------------------------------------------------------------------
  // Get weight history for last 30 days
  // ---------------------------------------------------------------------------
  const getWeightHistory30Days = useCallback(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return weightHistory
      .filter(entry => new Date(entry.recorded_at) >= thirtyDaysAgo)
      .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());
  }, [weightHistory]);

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
