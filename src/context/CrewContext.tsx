/**
 * UltraEdge Crew Context
 * Local state management with AsyncStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EVENT_CREW_KEY,
  migrateLegacyCrewRoles,
  StoredCrewMemberRecord,
  EventCrewAssignment,
} from '../lib/eventCrew';

// Simple UUID generator for local storage
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// ============================================================================
// TYPES
// ============================================================================

export type CrewRole = 'pacer' | 'crew_chief' | 'driver' | 'medical' | 'photographer' | 'other';

export interface CrewMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrewMemberInsert {
  name: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
}

export interface CrewMemberUpdate {
  name?: string;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
  avatar_url?: string | null;
}

interface CrewContextType {
  crewMembers: CrewMember[];
  loading: boolean;
  error: string | null;
  createCrewMember: (member: CrewMemberInsert) => Promise<CrewMember>;
  updateCrewMember: (id: string, updates: CrewMemberUpdate) => Promise<CrewMember | null>;
  deleteCrewMember: (id: string) => Promise<boolean>;
  getCrewMember: (id: string) => CrewMember | undefined;
  refreshCrewMembers: () => Promise<void>;
}

const CREW_STORAGE_KEY = '@ultraedge/crew';

// ============================================================================
// ROLE CONFIGURATION
// ============================================================================

export const ROLE_CONFIG: Record<CrewRole, { label: string; icon: string; color: string }> = {
  pacer: { label: 'Pacer', icon: 'walk', color: '#2D5A3D' },
  crew_chief: { label: 'Crew Chief', icon: 'shield-checkmark', color: '#8B6F47' },
  driver: { label: 'Driver', icon: 'car', color: '#5B8FA8' },
  medical: { label: 'Medical', icon: 'medkit', color: '#C45B4A' },
  photographer: { label: 'Photographer', icon: 'camera', color: '#E07B4C' },
  other: { label: 'Other', icon: 'person', color: '#9A8E7F' },
};

export const ROLES: CrewRole[] = ['pacer', 'crew_chief', 'driver', 'medical', 'photographer', 'other'];

// ============================================================================
// CONTEXT
// ============================================================================

const CrewContext = createContext<CrewContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface CrewProviderProps {
  children: ReactNode;
}

export function CrewProvider({ children }: CrewProviderProps) {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load crew members from storage
  const loadCrewMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [storedMembers, storedAssignments] = await Promise.all([
        AsyncStorage.getItem(CREW_STORAGE_KEY),
        AsyncStorage.getItem(EVENT_CREW_KEY),
      ]);
      if (storedMembers) {
        const parsed = JSON.parse(storedMembers) as StoredCrewMemberRecord[];
        const parsedAssignments: EventCrewAssignment[] = storedAssignments
          ? JSON.parse(storedAssignments)
          : [];

        // One-time migration: move legacy profile roles onto event assignments
        const { members, assignments, changed } = migrateLegacyCrewRoles(
          parsed,
          parsedAssignments
        );
        if (changed) {
          await Promise.all([
            AsyncStorage.setItem(CREW_STORAGE_KEY, JSON.stringify(members)),
            AsyncStorage.setItem(EVENT_CREW_KEY, JSON.stringify(assignments)),
          ]);
        }

        const loaded = members as unknown as CrewMember[];
        // Sort by name alphabetically
        loaded.sort((a, b) => a.name.localeCompare(b.name));
        setCrewMembers(loaded);
      }
    } catch (err) {
      console.error('Failed to load crew members:', err);
      setError('Failed to load crew members');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save crew members to storage
  const saveCrewMembers = async (updatedMembers: CrewMember[]) => {
    try {
      await AsyncStorage.setItem(CREW_STORAGE_KEY, JSON.stringify(updatedMembers));
    } catch (err) {
      console.error('Failed to save crew members:', err);
      throw new Error('Failed to save crew members');
    }
  };

  // Initial load
  useEffect(() => {
    loadCrewMembers();
  }, [loadCrewMembers]);

  // Create a new crew member
  const createCrewMember = async (memberData: CrewMemberInsert): Promise<CrewMember> => {
    const now = new Date().toISOString();
    const newMember: CrewMember = {
      id: generateId(),
      name: memberData.name,
      phone: memberData.phone || null,
      email: memberData.email || null,
      notes: memberData.notes || null,
      avatar_url: memberData.avatar_url || null,
      created_at: now,
      updated_at: now,
    };

    const updatedMembers = [...crewMembers, newMember];
    // Sort by name
    updatedMembers.sort((a, b) => a.name.localeCompare(b.name));
    await saveCrewMembers(updatedMembers);
    setCrewMembers(updatedMembers);
    return newMember;
  };

  // Update an existing crew member
  const updateCrewMember = async (id: string, updates: CrewMemberUpdate): Promise<CrewMember | null> => {
    const index = crewMembers.findIndex(m => m.id === id);
    if (index === -1) return null;

    const updatedMember: CrewMember = {
      ...crewMembers[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const updatedMembers = [...crewMembers];
    updatedMembers[index] = updatedMember;
    // Re-sort by name
    updatedMembers.sort((a, b) => a.name.localeCompare(b.name));
    await saveCrewMembers(updatedMembers);
    setCrewMembers(updatedMembers);
    return updatedMember;
  };

  // Delete a crew member
  const deleteCrewMember = async (id: string): Promise<boolean> => {
    const index = crewMembers.findIndex(m => m.id === id);
    if (index === -1) return false;

    const updatedMembers = crewMembers.filter(m => m.id !== id);
    await saveCrewMembers(updatedMembers);
    setCrewMembers(updatedMembers);
    return true;
  };

  // Get a single crew member by ID
  const getCrewMember = (id: string): CrewMember | undefined => {
    return crewMembers.find(m => m.id === id);
  };

  // Refresh crew members from storage
  const refreshCrewMembers = async () => {
    await loadCrewMembers();
  };

  return (
    <CrewContext.Provider
      value={{
        crewMembers,
        loading,
        error,
        createCrewMember,
        updateCrewMember,
        deleteCrewMember,
        getCrewMember,
        refreshCrewMembers,
      }}
    >
      {children}
    </CrewContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCrewMembers(): CrewContextType {
  const context = useContext(CrewContext);
  if (!context) {
    throw new Error('useCrewMembers must be used within a CrewProvider');
  }
  return context;
}

export default CrewContext;
