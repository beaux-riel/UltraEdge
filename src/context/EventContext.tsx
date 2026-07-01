/**
 * UltraEdge Event Context
 * Local state management with AsyncStorage persistence
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event, EventInsert, EventUpdate, EventStatus, DistanceUnit, ElevationUnit } from '../lib/database.types';

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

interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (event: Omit<EventInsert, 'mover_id'>) => Promise<Event>;
  updateEvent: (id: string, updates: EventUpdate) => Promise<Event | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  getEvent: (id: string) => Event | undefined;
  refreshEvents: () => Promise<void>;
}

const EVENTS_STORAGE_KEY = '@ultraedge/events';

// ============================================================================
// DEFAULT MOVER ID (temporary until auth)
// ============================================================================

const DEFAULT_MOVER_ID = 'local-mover-001';

// ============================================================================
// CONTEXT
// ============================================================================

const EventContext = createContext<EventContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface EventProviderProps {
  children: ReactNode;
}

export function EventProvider({ children }: EventProviderProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events from storage
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stored = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Event[];
        // Sort by event_date, nulls last
        parsed.sort((a, b) => {
          if (!a.event_date && !b.event_date) return 0;
          if (!a.event_date) return 1;
          if (!b.event_date) return -1;
          return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
        });
        setEvents(parsed);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, []);

  // Save events to storage
  const saveEvents = async (updatedEvents: Event[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(updatedEvents));
    } catch (err) {
      console.error('Failed to save events:', err);
      throw new Error('Failed to save events');
    }
  };

  // Initial load
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Create a new event
  const createEvent = async (eventData: Omit<EventInsert, 'mover_id'>): Promise<Event> => {
    const now = new Date().toISOString();
    const newEvent: Event = {
      id: generateId(),
      mover_id: DEFAULT_MOVER_ID,
      name: eventData.name,
      description: eventData.description || null,
      event_date: eventData.event_date || null,
      event_time: eventData.event_time || null,
      location: eventData.location || null,
      start_location: eventData.start_location || null,
      finish_location: eventData.finish_location || null,
      total_distance: eventData.total_distance || null,
      distance_unit: eventData.distance_unit || 'miles',
      total_elevation_gain: eventData.total_elevation_gain || null,
      total_elevation_loss: eventData.total_elevation_loss || null,
      elevation_unit: eventData.elevation_unit || 'feet',
      cutoff_time: eventData.cutoff_time || null,
      target_time: eventData.target_time || null,
      status: eventData.status || 'draft',
      mover_weight_snapshot: eventData.mover_weight_snapshot || null,
      total_gear_weight: eventData.total_gear_weight || null,
      total_nutrition_weight: eventData.total_nutrition_weight || null,
      total_hydration_weight: eventData.total_hydration_weight || null,
      race_website: eventData.race_website || null,
      course_map_url: eventData.course_map_url || null,
      gpx_file_url: eventData.gpx_file_url || null,
      created_at: now,
      updated_at: now,
    };

    const updatedEvents = [...events, newEvent];
    await saveEvents(updatedEvents);
    setEvents(updatedEvents);
    return newEvent;
  };

  // Update an existing event
  const updateEvent = async (id: string, updates: EventUpdate): Promise<Event | null> => {
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return null;

    const updatedEvent: Event = {
      ...events[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const updatedEvents = [...events];
    updatedEvents[index] = updatedEvent;
    await saveEvents(updatedEvents);
    setEvents(updatedEvents);
    return updatedEvent;
  };

  // Delete an event
  const deleteEvent = async (id: string): Promise<boolean> => {
    const index = events.findIndex(e => e.id === id);
    if (index === -1) return false;

    const updatedEvents = events.filter(e => e.id !== id);
    await saveEvents(updatedEvents);
    setEvents(updatedEvents);
    return true;
  };

  // Get a single event by ID
  const getEvent = (id: string): Event | undefined => {
    return events.find(e => e.id === id);
  };

  // Refresh events from storage
  const refreshEvents = async () => {
    await loadEvents();
  };

  return (
    <EventContext.Provider
      value={{
        events,
        loading,
        error,
        createEvent,
        updateEvent,
        deleteEvent,
        getEvent,
        refreshEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useEvents(): EventContextType {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
}

export default EventContext;
