/**
 * UltraEdge Drop Bag Context
 * Local state management with AsyncStorage persistence
 * Manages drop bags that can be placed at checkpoints
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple UUID generator for local storage
const generateId = (): string => {
  return 'db_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// ============================================================================
// TYPES
// ============================================================================

export interface DropBagItem {
  id: string;
  type: 'gear' | 'consumable';
  refId: string; // Reference to gear item ID
  name: string; // Denormalized for display
  quantity: number;
  notes?: string;
}

export interface DropBag {
  id: string;
  name: string;
  eventId: string;
  checkpointId: string | null; // Where it's placed (null = not assigned yet)
  items: DropBagItem[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DropBagInsert {
  name: string;
  eventId: string;
  checkpointId?: string | null;
  items?: DropBagItem[];
  notes?: string | null;
}

export interface DropBagUpdate {
  name?: string;
  checkpointId?: string | null;
  items?: DropBagItem[];
  notes?: string | null;
}

interface DropBagContextType {
  dropBags: DropBag[];
  loading: boolean;
  error: string | null;
  createDropBag: (bag: DropBagInsert) => Promise<DropBag>;
  updateDropBag: (id: string, updates: DropBagUpdate) => Promise<DropBag | null>;
  deleteDropBag: (id: string) => Promise<boolean>;
  getDropBag: (id: string) => DropBag | undefined;
  getDropBagsByEvent: (eventId: string) => DropBag[];
  getDropBagsByCheckpoint: (checkpointId: string) => DropBag[];
  addItemToDropBag: (bagId: string, item: Omit<DropBagItem, 'id'>) => Promise<DropBag | null>;
  removeItemFromDropBag: (bagId: string, itemId: string) => Promise<DropBag | null>;
  updateItemInDropBag: (bagId: string, itemId: string, updates: Partial<DropBagItem>) => Promise<DropBag | null>;
  refreshDropBags: () => Promise<void>;
}

const STORAGE_KEY = '@ultraedge/dropbags';

// ============================================================================
// CONTEXT
// ============================================================================

const DropBagContext = createContext<DropBagContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface DropBagProviderProps {
  children: ReactNode;
}

export function DropBagProvider({ children }: DropBagProviderProps) {
  const [dropBags, setDropBags] = useState<DropBag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load drop bags from storage
  const loadDropBags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DropBag[];
        // Sort by created_at descending (newest first)
        parsed.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setDropBags(parsed);
      }
    } catch (err) {
      console.error('Failed to load drop bags:', err);
      setError('Failed to load drop bags');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save drop bags to storage
  const saveDropBags = async (updatedBags: DropBag[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBags));
    } catch (err) {
      console.error('Failed to save drop bags:', err);
      throw new Error('Failed to save drop bags');
    }
  };

  // Initial load
  useEffect(() => {
    loadDropBags();
  }, [loadDropBags]);

  // Create a new drop bag
  const createDropBag = async (bagData: DropBagInsert): Promise<DropBag> => {
    const now = new Date().toISOString();
    const newBag: DropBag = {
      id: generateId(),
      name: bagData.name,
      eventId: bagData.eventId,
      checkpointId: bagData.checkpointId || null,
      items: bagData.items || [],
      notes: bagData.notes || null,
      created_at: now,
      updated_at: now,
    };

    const updatedBags = [newBag, ...dropBags];
    await saveDropBags(updatedBags);
    setDropBags(updatedBags);
    return newBag;
  };

  // Update an existing drop bag
  const updateDropBag = async (id: string, updates: DropBagUpdate): Promise<DropBag | null> => {
    const index = dropBags.findIndex(b => b.id === id);
    if (index === -1) return null;

    const updatedBag: DropBag = {
      ...dropBags[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const updatedBags = [...dropBags];
    updatedBags[index] = updatedBag;
    await saveDropBags(updatedBags);
    setDropBags(updatedBags);
    return updatedBag;
  };

  // Delete a drop bag
  const deleteDropBag = async (id: string): Promise<boolean> => {
    const index = dropBags.findIndex(b => b.id === id);
    if (index === -1) return false;

    const updatedBags = dropBags.filter(b => b.id !== id);
    await saveDropBags(updatedBags);
    setDropBags(updatedBags);
    return true;
  };

  // Get a single drop bag by ID
  const getDropBag = (id: string): DropBag | undefined => {
    return dropBags.find(b => b.id === id);
  };

  // Get drop bags for a specific event
  const getDropBagsByEvent = (eventId: string): DropBag[] => {
    return dropBags.filter(b => b.eventId === eventId);
  };

  // Get drop bags for a specific checkpoint
  const getDropBagsByCheckpoint = (checkpointId: string): DropBag[] => {
    return dropBags.filter(b => b.checkpointId === checkpointId);
  };

  // Add an item to a drop bag
  const addItemToDropBag = async (bagId: string, item: Omit<DropBagItem, 'id'>): Promise<DropBag | null> => {
    const bag = dropBags.find(b => b.id === bagId);
    if (!bag) return null;

    const newItem: DropBagItem = {
      ...item,
      id: generateId(),
    };

    return updateDropBag(bagId, {
      items: [...bag.items, newItem],
    });
  };

  // Remove an item from a drop bag
  const removeItemFromDropBag = async (bagId: string, itemId: string): Promise<DropBag | null> => {
    const bag = dropBags.find(b => b.id === bagId);
    if (!bag) return null;

    return updateDropBag(bagId, {
      items: bag.items.filter(i => i.id !== itemId),
    });
  };

  // Update an item in a drop bag
  const updateItemInDropBag = async (
    bagId: string, 
    itemId: string, 
    updates: Partial<DropBagItem>
  ): Promise<DropBag | null> => {
    const bag = dropBags.find(b => b.id === bagId);
    if (!bag) return null;

    return updateDropBag(bagId, {
      items: bag.items.map(i => 
        i.id === itemId ? { ...i, ...updates } : i
      ),
    });
  };

  // Refresh drop bags from storage
  const refreshDropBags = async () => {
    await loadDropBags();
  };

  return (
    <DropBagContext.Provider
      value={{
        dropBags,
        loading,
        error,
        createDropBag,
        updateDropBag,
        deleteDropBag,
        getDropBag,
        getDropBagsByEvent,
        getDropBagsByCheckpoint,
        addItemToDropBag,
        removeItemFromDropBag,
        updateItemInDropBag,
        refreshDropBags,
      }}
    >
      {children}
    </DropBagContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useDropBags(): DropBagContextType {
  const context = useContext(DropBagContext);
  if (!context) {
    throw new Error('useDropBags must be used within a DropBagProvider');
  }
  return context;
}

export default DropBagContext;
