/**
 * UltraEdge Checkpoint Context
 * Manages checkpoints/aid stations within events
 * Uses AsyncStorage for local persistence
 */

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { runLocalPlanOperation, readCheckpointMap, subscribePlanChanges, requireLocalEvent, deleteLocalCheckpoints } from '../lib/localPlanStorage';
import { Checkpoint, CheckpointInsert, CheckpointUpdate, CheckpointType } from '../lib/database.types';

// Generate UUID (simple version for client-side)
const generateId = (): string => {
  return 'cp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

interface CheckpointContextType {
  checkpoints: Record<string, Checkpoint[]>; // eventId -> checkpoints[]
  loading: boolean;
  error: string | null;
  refreshCheckpoints: () => Promise<void>;
  // CRUD operations
  getCheckpointsByEventId: (eventId: string) => Checkpoint[];
  getCheckpointById: (eventId: string, checkpointId: string) => Checkpoint | undefined;
  addCheckpoint: (eventId: string, checkpoint: Omit<CheckpointInsert, 'event_id' | 'order_index'>) => Promise<Checkpoint>;
  updateCheckpoint: (eventId: string, checkpointId: string, updates: CheckpointUpdate) => Promise<void>;
  deleteCheckpoint: (eventId: string, checkpointId: string) => Promise<void>;
  reorderCheckpoints: (eventId: string, checkpointIds: string[]) => Promise<void>;
  // Bulk operations
  deleteAllCheckpointsForEvent: (eventId: string) => Promise<void>;
  duplicateCheckpoint: (eventId: string, checkpointId: string) => Promise<Checkpoint | undefined>;
}

const CheckpointContext = createContext<CheckpointContextType | undefined>(undefined);

const STORAGE_KEY = 'ultraedge_checkpoints';

export function CheckpointProvider({ children }: { children: React.ReactNode }) {
  const [checkpoints, setCheckpoints] = useState<Record<string, Checkpoint[]>>({});
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const refreshCheckpoints = useCallback(async () => {
    setLoading(true);
    try {
      const loaded = await runLocalPlanOperation(() => readCheckpointMap<Checkpoint>());
      setCheckpoints(loaded);
      setReady(true);
      setError(null);
    } catch {
      setReady(false);
      setError('Checkpoints could not be loaded. Your saved data has been preserved. Try again.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void refreshCheckpoints();
    return subscribePlanChanges(keys => {
      if (keys.includes(STORAGE_KEY)) void refreshCheckpoints();
    });
  }, [refreshCheckpoints]);

  const persist = useCallback(async (eventId: string, transform: (previous: Record<string, Checkpoint[]>) => Record<string, Checkpoint[]>) => {
    if (!ready || loading) throw new Error('Load checkpoints successfully before editing.');
    try {
      await runLocalPlanOperation(async () => {
        await requireLocalEvent(eventId);
        const previous = await readCheckpointMap<Checkpoint>();
        const next = transform(previous);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setCheckpoints(next);
        setError(null);
      });
    } catch (cause) {
      setError('Changes were not saved. Please try again.');
      throw cause;
    }
  }, [ready, loading]);

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
  const addCheckpoint = useCallback(async (
    eventId: string,
    checkpointData: Omit<CheckpointInsert, 'event_id' | 'order_index'>
  ): Promise<Checkpoint> => {
    const now = new Date().toISOString();

    const newCheckpoint: Checkpoint = {
      id: generateId(),
      event_id: eventId,
      order_index: 0,
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

    await persist(eventId, prev => {
      newCheckpoint.order_index = Math.max(-1, ...(prev[eventId] || []).map(cp => cp.order_index)) + 1;
      return { ...prev, [eventId]: [...(prev[eventId] || []), newCheckpoint] };
    });

    return newCheckpoint;
  }, [persist]);

  // Update an existing checkpoint
  const updateCheckpoint = useCallback(async (
    eventId: string,
    checkpointId: string,
    updates: CheckpointUpdate
  ) => {
    await persist(eventId, prev => {
      const eventCheckpoints = prev[eventId] || [];
      if (!eventCheckpoints.some(cp => cp.id === checkpointId)) throw new Error('This checkpoint was deleted. Refresh before editing.');
      return {
        ...prev,
        [eventId]: eventCheckpoints.map(cp =>
          cp.id === checkpointId
            ? { ...cp, ...updates, updated_at: new Date().toISOString() }
            : cp
        ),
      };
    });
  }, [persist]);

  // Delete a checkpoint
  const deleteCheckpoint = useCallback(async (eventId: string, checkpointId: string) => {
    if (!ready || loading) throw new Error('Load checkpoints successfully before deleting.');
    await deleteLocalCheckpoints(eventId, checkpointId);
  }, [ready, loading]);

  // Reorder checkpoints
  const reorderCheckpoints = useCallback(async (eventId: string, checkpointIds: string[]) => {
    await persist(eventId, prev => {
      const eventCheckpoints = prev[eventId] || [];
      if (new Set(checkpointIds).size !== eventCheckpoints.length || checkpointIds.length !== eventCheckpoints.length || eventCheckpoints.some(cp => !checkpointIds.includes(cp.id))) throw new Error('Checkpoint order must include every checkpoint exactly once.');
      const reordered = checkpointIds.map((id, index) => {
        const cp = eventCheckpoints.find(c => c.id === id);
        return cp ? { ...cp, order_index: index, updated_at: new Date().toISOString() } : null;
      }).filter((cp): cp is Checkpoint => cp !== null);
      return {
        ...prev,
        [eventId]: reordered,
      };
    });
  }, [persist]);

  // Delete all checkpoints for an event
  const deleteAllCheckpointsForEvent = useCallback(async (eventId: string) => {
    if (!ready || loading) throw new Error('Load checkpoints successfully before deleting.');
    await deleteLocalCheckpoints(eventId);
  }, [ready, loading]);

  // Duplicate a checkpoint
  const duplicateCheckpoint = useCallback(async (eventId: string, checkpointId: string): Promise<Checkpoint | undefined> => {
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
        error,
        refreshCheckpoints,
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
