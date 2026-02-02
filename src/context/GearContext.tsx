/**
 * GearContext — Local-first gear inventory management
 * Uses AsyncStorage for persistence (no auth required)
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export type WeightUnit = 'g' | 'oz' | 'kg' | 'lbs';
export type GearCategory = 
  | 'footwear' 
  | 'clothing' 
  | 'pack' 
  | 'hydration' 
  | 'lighting' 
  | 'navigation' 
  | 'safety' 
  | 'poles' 
  | 'nutrition' 
  | 'other';

export interface GearItem {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  category: GearCategory;
  weight?: number;
  weightUnit: WeightUnit;
  color?: string;
  size?: string;
  quantity: number;
  notes?: string;
  imageUrl?: string;
  isActive: boolean;
  retired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface GearContextType {
  gearItems: GearItem[];
  loading: boolean;
  error: string | null;
  addGearItem: (item: Omit<GearItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<GearItem>;
  updateGearItem: (id: string, updates: Partial<GearItem>) => Promise<GearItem | null>;
  deleteGearItem: (id: string) => Promise<boolean>;
  getGearItem: (id: string) => GearItem | undefined;
  getGearByCategory: (category: GearCategory) => GearItem[];
  getTotalWeight: (unit?: WeightUnit) => number;
  refreshGear: () => Promise<void>;
}

const GearContext = createContext<GearContextType | undefined>(undefined);

const STORAGE_KEY = '@ultraedge/gear-items';

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Weight conversion helper
const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  // Convert to grams first
  let grams: number;
  switch (fromUnit) {
    case 'g': grams = weight; break;
    case 'oz': grams = weight * 28.3495; break;
    case 'kg': grams = weight * 1000; break;
    case 'lbs': grams = weight * 453.592; break;
    default: grams = weight;
  }
  
  // Convert from grams to target unit
  switch (toUnit) {
    case 'g': return grams;
    case 'oz': return grams / 28.3495;
    case 'kg': return grams / 1000;
    case 'lbs': return grams / 453.592;
    default: return grams;
  }
};

interface GearProviderProps {
  children: ReactNode;
}

export function GearProvider({ children }: GearProviderProps) {
  const [gearItems, setGearItems] = useState<GearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load gear from AsyncStorage
  const loadGear = async () => {
    try {
      setLoading(true);
      setError(null);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setGearItems(parsed);
      }
    } catch (err) {
      console.error('Failed to load gear:', err);
      setError('Failed to load gear items');
    } finally {
      setLoading(false);
    }
  };

  // Save gear to AsyncStorage
  const saveGear = async (items: GearItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      setGearItems(items);
    } catch (err) {
      console.error('Failed to save gear:', err);
      setError('Failed to save gear items');
      throw err;
    }
  };

  // Load on mount
  useEffect(() => {
    loadGear();
  }, []);

  // Add gear item
  const addGearItem = async (item: Omit<GearItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<GearItem> => {
    const now = new Date().toISOString();
    const newItem: GearItem = {
      ...item,
      id: generateId(),
      quantity: item.quantity || 1,
      isActive: item.isActive ?? true,
      retired: item.retired ?? false,
      createdAt: now,
      updatedAt: now,
    };
    
    const updated = [...gearItems, newItem];
    await saveGear(updated);
    return newItem;
  };

  // Update gear item
  const updateGearItem = async (id: string, updates: Partial<GearItem>): Promise<GearItem | null> => {
    const index = gearItems.findIndex(g => g.id === id);
    if (index === -1) return null;
    
    const updatedItem: GearItem = {
      ...gearItems[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    const updated = [...gearItems];
    updated[index] = updatedItem;
    await saveGear(updated);
    return updatedItem;
  };

  // Delete gear item
  const deleteGearItem = async (id: string): Promise<boolean> => {
    const index = gearItems.findIndex(g => g.id === id);
    if (index === -1) return false;
    
    const updated = gearItems.filter(g => g.id !== id);
    await saveGear(updated);
    return true;
  };

  // Get single gear item
  const getGearItem = (id: string): GearItem | undefined => {
    return gearItems.find(g => g.id === id);
  };

  // Get gear by category
  const getGearByCategory = (category: GearCategory): GearItem[] => {
    return gearItems.filter(g => g.category === category && !g.retired);
  };

  // Get total weight (in specified unit, default grams)
  const getTotalWeight = (unit: WeightUnit = 'g'): number => {
    return gearItems
      .filter(g => !g.retired && g.weight)
      .reduce((total, item) => {
        const weightInTarget = convertWeight(
          (item.weight || 0) * item.quantity,
          item.weightUnit,
          unit
        );
        return total + weightInTarget;
      }, 0);
  };

  // Refresh gear from storage
  const refreshGear = async () => {
    await loadGear();
  };

  return (
    <GearContext.Provider
      value={{
        gearItems,
        loading,
        error,
        addGearItem,
        updateGearItem,
        deleteGearItem,
        getGearItem,
        getGearByCategory,
        getTotalWeight,
        refreshGear,
      }}
    >
      {children}
    </GearContext.Provider>
  );
}

export function useGear(): GearContextType {
  const context = useContext(GearContext);
  if (!context) {
    throw new Error('useGear must be used within a GearProvider');
  }
  return context;
}

export default GearContext;
