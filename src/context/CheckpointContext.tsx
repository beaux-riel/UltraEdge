/**
 * UltraEdge Checkpoint Context
 * Manages checkpoints/aid stations within events
 * Uses AsyncStorage for local persistence
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Checkpoint, CheckpointInsert, CheckpointUpdate, CheckpointType } from '../lib/database.types';

// Generate UUID (simple version for client-side)
const generateId = (): string => {
  return 'cp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

interface CheckpointContextType {
  checkpoints: Record<string, Checkpoint[]>; // eventId -> checkpoints[]
  loading: boolean;
  // CRUD operations
  getCheckpointsByEventId: (eventId: string) => Checkpoint[];
  getCheckpointById: (eventId: string, checkpointId: string) => Checkpoint | undefined;
  addCheckpoint: (eventId: string, checkpoint: Omit<CheckpointInsert, 'event_id' | 'order_index'>) => Checkpoint;
  updateCheckpoint: (eventId: string, checkpointId: string, updates: CheckpointUpdate) => void;
  deleteCheckpoint: (eventId: string, checkpointId: string) => void;
  reorderCheckpoints: (eventId: string, checkpointIds: string[]) => void;
  // Bulk operations
  deleteAllCheckpointsForEvent: (eventId: string) => void;
  duplicateCheckpoint: (eventId: string, checkpointId: string) => Checkpoint | undefined;
}

const CheckpointContext = createContext<CheckpointContextType | undefined>(undefined);

const STORAGE_KEY = 'ultraedge_checkpoints';

export function CheckpointProvider({ children }: { children: React.ReactNode }) {
  const [checkpoints, setCheckpoints] = useState<Record<string, Checkpoint[]>>({});
  const [loading, setLoading] = useState(true);

  // Load checkpoints from AsyncStorage on mount
  useEffect(() => {
    const loadCheckpoints = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            setCheckpoints(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load checkpoints from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCheckpoints();
  }, []);

  // Save checkpoints to AsyncStorage whenever they change
  useEffect(() => {
    const saveCheckpoints = async () => {
      if (!loading) {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(checkpoints));
        } catch (error) {
          console.error('Failed to save checkpoints to storage:', error);
        }
      }
    };

    saveCheckpoints();
  }, [checkpoints, loading]);

  // Get all checkpoints for an event, sorted by order_index
  const getCheckpointsByEventId = useCallback((eventId: string): Checkpoint[] => {
    const eventCheckpoints = checkpoints[eventId] || [];
    return [...eventCheckpoints].sort((a, b) => a.order_index - b.order_index);
  }, [checkpoints]);

  // Get a specific checkpoint
  const getCheckpointById = useCallback((eventId: string, checkpointId: string): Checkpoint | undefined => {
    const eventCheckpoints = checkpoints[eventId] || [];
    return eventCheckpoints.find(cp => cp.id === checkpointId);
  }, [checkpoints]);

  // Add a new checkpoint
  const addCheckpoint = useCallback((
    eventId: string,
    checkpointData: Omit<CheckpointInsert, 'event_id' | 'order_index'>
  ): Checkpoint => {
    const now = new Date().toISOString();
    const eventCheckpoints = checkpoints[eventId] || [];
    const maxOrder = eventCheckpoints.length > 0
      ? Math.max(...eventCheckpoints.map(cp => cp.order_index))
      : -1;

    const newCheckpoint: Checkpoint = {
      id: generateId(),
      event_id: eventId,
      order_index: maxOrder + 1,
      name: checkpointData.name,
      checkpoint_type: checkpointData.checkpoint_type,
      distance_from_start: checkpointData.distance_from_start ?? null,
      elevation: checkpointData.elevation ?? null,
      location_description: checkpointData.location_description ?? null,
      latitude: checkpointData.latitude ?? null,
      longitude: checkpointData.longitude ?? null,
      cutoff_time: checkpointData.cutoff_time ?? null,
      cutoff_duration: checkpointData.cutoff_duration ?? null,
      estimated_arrival: checkpointData.estimated_arrival ?? null,
      estimated_duration: checkpointData.estimated_duration ?? null,
      has_crew_access: checkpointData.has_crew_access ?? false,
      has_drop_bag: checkpointData.has_drop_bag ?? false,
      has_pacer_pickup: checkpointData.has_pacer_pickup ?? false,
      has_pacer_dropoff: checkpointData.has_pacer_dropoff ?? false,
      aid_supplies: checkpointData.aid_supplies ?? [],
      notes: checkpointData.notes ?? null,
      created_at: now,
      updated_at: now,
    };

    setCheckpoints(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), newCheckpoint],
    }));

    return newCheckpoint;
  }, [checkpoints]);

  // Update an existing checkpoint
  const updateCheckpoint = useCallback((
    eventId: string,
    checkpointId: string,
    updates: CheckpointUpdate
  ) => {
    setCheckpoints(prev => {
      const eventCheckpoints = prev[eventId] || [];
      return {
        ...prev,
        [eventId]: eventCheckpoints.map(cp =>
          cp.id === checkpointId
            ? { ...cp, ...updates, updated_at: new Date().toISOString() }
            : cp
        ),
      };
    });
  }, []);

  // Delete a checkpoint
  const deleteCheckpoint = useCallback((eventId: string, checkpointId: string) => {
    setCheckpoints(prev => {
      const eventCheckpoints = prev[eventId] || [];
      const filtered = eventCheckpoints.filter(cp => cp.id !== checkpointId);
      // Reindex order_index after deletion
      const reindexed = filtered
        .sort((a, b) => a.order_index - b.order_index)
        .map((cp, index) => ({ ...cp, order_index: index }));
      return {
        ...prev,
        [eventId]: reindexed,
      };
    });
  }, []);

  // Reorder checkpoints
  const reorderCheckpoints = useCallback((eventId: string, checkpointIds: string[]) => {
    setCheckpoints(prev => {
      const eventCheckpoints = prev[eventId] || [];
      const reordered = checkpointIds.map((id, index) => {
        const cp = eventCheckpoints.find(c => c.id === id);
        return cp ? { ...cp, order_index: index, updated_at: new Date().toISOString() } : null;
      }).filter((cp): cp is Checkpoint => cp !== null);
      return {
        ...prev,
        [eventId]: reordered,
      };
    });
  }, []);

  // Delete all checkpoints for an event
  const deleteAllCheckpointsForEvent = useCallback((eventId: string) => {
    setCheckpoints(prev => {
      const { [eventId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  // Duplicate a checkpoint
  const duplicateCheckpoint = useCallback((eventId: string, checkpointId: string): Checkpoint | undefined => {
    const original = getCheckpointById(eventId, checkpointId);
    if (!original) return undefined;

    const { id, created_at, updated_at, order_index, ...rest } = original;
    return addCheckpoint(eventId, {
      ...rest,
      name: `${original.name} (Copy)`,
    });
  }, [getCheckpointById, addCheckpoint]);

  return (
    <CheckpointContext.Provider
      value={{
        checkpoints,
        loading,
        getCheckpointsByEventId,
        getCheckpointById,
        addCheckpoint,
        updateCheckpoint,
        deleteCheckpoint,
        reorderCheckpoints,
        deleteAllCheckpointsForEvent,
        duplicateCheckpoint,
      }}
    >
      {children}
    </CheckpointContext.Provider>
  );
}

// Hook to use checkpoint context
export function useCheckpoints() {
  const context = useContext(CheckpointContext);
  if (context === undefined) {
    throw new Error('useCheckpoints must be used within a CheckpointProvider');
  }
  return context;
}

// Helper: get checkpoint type display info
export const CHECKPOINT_TYPE_INFO: Record<CheckpointType, { label: string; icon: string; color: string }> = {
  start: { label: 'Start', icon: 'flag', color: '#2D5A3D' },
  aid_station: { label: 'Aid Station', icon: 'medical', color: '#5B8FA8' },
  crew_access: { label: 'Crew Access', icon: 'people', color: '#8B6F47' },
  drop_bag: { label: 'Drop Bag', icon: 'bag-handle', color: '#E07B4C' },
  gear_check: { label: 'Gear Check', icon: 'checkmark-circle', color: '#5A9A6B' },
  timing: { label: 'Timing Mat', icon: 'timer', color: '#6B5D4D' },
  finish: { label: 'Finish', icon: 'trophy', color: '#D4763B' },
  other: { label: 'Other', icon: 'location', color: '#9A8E7F' },
};

export default CheckpointContext;
