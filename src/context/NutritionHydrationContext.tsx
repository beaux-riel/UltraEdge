import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define types for nutrition and hydration plans
export interface NutritionEntry {
  id: string;
  foodType: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  timing: string;
  frequency: string;
  quantity: number;
  quantityUnit?: string;
  sodium?: number;
  potassium?: number;
  magnesium?: number;
  isEssential?: boolean;
  sourceLocation?: string;
  notes?: string;
}

export interface HydrationEntry {
  id: string;
  liquidType: string;
  volume: number;
  volumeUnit: string;
  electrolytes?: {
    sodium?: number;
    potassium?: number;
    magnesium?: number;
  };
  timing: string;
  frequency: string;
  consumptionRate?: number;
  temperature?: string;
  sourceLocation?: string;
  containerType?: string;
}

export interface Rule {
  id: string;
  ruleType: 'time' | 'distance' | 'temperature';
  condition: string;
  value: string;
  unit: string;
  action: 'increase' | 'decrease' | 'set';
  target: string;
  amount: string;
}

export interface NutritionPlan {
  id: string;
  name: string;
  description?: string;
  raceType?: string;
  raceDuration?: string;
  terrainType?: string;
  weatherCondition?: string;
  intensityLevel?: string;
  createdAt: string;
  updatedAt: string;
  entries: NutritionEntry[];
  rules?: Rule[];
}

export interface HydrationPlan {
  id: string;
  name: string;
  description?: string;
  raceType?: string;
  raceDuration?: string;
  terrainType?: string;
  weatherCondition?: string;
  intensityLevel?: string;
  createdAt: string;
  updatedAt: string;
  entries: HydrationEntry[];
  rules?: Rule[];
}

// Define race plan assignment interface
export interface RacePlanAssignment {
  id: string;
  raceId: string;
  nutritionPlanId?: string;
  hydrationPlanId?: string;
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Define context type
interface NutritionHydrationContextType {
  nutritionPlans: Record<string, NutritionPlan>;
  hydrationPlans: Record<string, HydrationPlan>;
  racePlanAssignments: Record<string, RacePlanAssignment>;
  loading: boolean;
  error: string | null;
  createNutritionPlan: (plan: Omit<NutritionPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; planId?: string; error?: string }>;
  updateNutritionPlan: (planId: string, plan: Partial<NutritionPlan>) => Promise<{ success: boolean; error?: string }>;
  deleteNutritionPlan: (planId: string) => Promise<{ success: boolean; error?: string }>;
  createHydrationPlan: (plan: Omit<HydrationPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; planId?: string; error?: string }>;
  updateHydrationPlan: (planId: string, plan: Partial<HydrationPlan>) => Promise<{ success: boolean; error?: string }>;
  deleteHydrationPlan: (planId: string) => Promise<{ success: boolean; error?: string }>;
  addNutritionEntry: (planId: string, entry: Omit<NutritionEntry, 'id'>) => Promise<{ success: boolean; entryId?: string; error?: string }>;
  updateNutritionEntry: (planId: string, entryId: string, entry: Partial<NutritionEntry>) => Promise<{ success: boolean; error?: string }>;
  deleteNutritionEntry: (planId: string, entryId: string) => Promise<{ success: boolean; error?: string }>;
  addHydrationEntry: (planId: string, entry: Omit<HydrationEntry, 'id'>) => Promise<{ success: boolean; entryId?: string; error?: string }>;
  updateHydrationEntry: (planId: string, entryId: string, entry: Partial<HydrationEntry>) => Promise<{ success: boolean; error?: string }>;
  deleteHydrationEntry: (planId: string, entryId: string) => Promise<{ success: boolean; error?: string }>;
  getNutritionPlan: (planId: string) => NutritionPlan | undefined;
  getHydrationPlan: (planId: string) => HydrationPlan | undefined;
  createRacePlanAssignment: (assignment: Omit<RacePlanAssignment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; assignmentId?: string; error?: string }>;
  updateRacePlanAssignment: (assignmentId: string, assignment: Partial<RacePlanAssignment>) => Promise<{ success: boolean; error?: string }>;
  deleteRacePlanAssignment: (assignmentId: string) => Promise<{ success: boolean; error?: string }>;
  getRacePlanAssignmentsByRaceId: (raceId: string) => RacePlanAssignment[];
}

// Create the context
const NutritionHydrationContext = createContext<NutritionHydrationContextType | undefined>(undefined);

// Provider props
interface NutritionHydrationProviderProps {
  children: ReactNode;
}

// Provider component
export const NutritionHydrationProvider: React.FC<NutritionHydrationProviderProps> = ({ children }) => {
  const [nutritionPlans, setNutritionPlans] = useState<Record<string, NutritionPlan>>({});
  const [hydrationPlans, setHydrationPlans] = useState<Record<string, HydrationPlan>>({});
  const [racePlanAssignments, setRacePlanAssignments] = useState<Record<string, RacePlanAssignment>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load nutrition plans
        const nutritionPlansJson = await AsyncStorage.getItem('nutritionPlans');
        if (nutritionPlansJson) {
          setNutritionPlans(JSON.parse(nutritionPlansJson));
        }
        
        // Load hydration plans
        const hydrationPlansJson = await AsyncStorage.getItem('hydrationPlans');
        if (hydrationPlansJson) {
          setHydrationPlans(JSON.parse(hydrationPlansJson));
        }
        
        // Load race plan assignments
        const racePlanAssignmentsJson = await AsyncStorage.getItem('racePlanAssignments');
        if (racePlanAssignmentsJson) {
          setRacePlanAssignments(JSON.parse(racePlanAssignmentsJson));
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load nutrition and hydration data');
        console.error('Error loading nutrition/hydration data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Save nutrition plans to storage
  const saveNutritionPlans = async (plans: Record<string, NutritionPlan>) => {
    try {
      await AsyncStorage.setItem('nutritionPlans', JSON.stringify(plans));
    } catch (err) {
      console.error('Error saving nutrition plans:', err);
      throw err;
    }
  };

  // Save hydration plans to storage
  const saveHydrationPlans = async (plans: Record<string, HydrationPlan>) => {
    try {
      await AsyncStorage.setItem('hydrationPlans', JSON.stringify(plans));
    } catch (err) {
      console.error('Error saving hydration plans:', err);
      throw err;
    }
  };
  
  // Save race plan assignments to storage
  const saveRacePlanAssignments = async (assignments: Record<string, RacePlanAssignment>) => {
    try {
      await AsyncStorage.setItem('racePlanAssignments', JSON.stringify(assignments));
    } catch (err) {
      console.error('Error saving race plan assignments:', err);
      throw err;
    }
  };

  // Create a new nutrition plan
  const createNutritionPlan = async (plan: Omit<NutritionPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const id = Date.now().toString();
      
      const newPlan: NutritionPlan = {
        ...plan,
        id,
        createdAt: now,
        updatedAt: now,
        entries: plan.entries || []
      };
      
      const updatedPlans = {
        ...nutritionPlans,
        [id]: newPlan
      };
      
      setNutritionPlans(updatedPlans);
      await saveNutritionPlans(updatedPlans);
      
      return { success: true, planId: id };
    } catch (err) {
      console.error('Error creating nutrition plan:', err);
      return { success: false, error: 'Failed to create nutrition plan' };
    }
  };

  // Update an existing nutrition plan
  const updateNutritionPlan = async (planId: string, plan: Partial<NutritionPlan>) => {
    try {
      if (!nutritionPlans[planId]) {
        return { success: false, error: 'Nutrition plan not found' };
      }
      
      const updatedPlan: NutritionPlan = {
        ...nutritionPlans[planId],
        ...plan,
        updatedAt: new Date().toISOString()
      };
      
      const updatedPlans = {
        ...nutritionPlans,
        [planId]: updatedPlan
      };
      
      setNutritionPlans(updatedPlans);
      await saveNutritionPlans(updatedPlans);
      
      return { success: true };
    } catch (err) {
      console.error('Error updating nutrition plan:', err);
      return { success: false, error: 'Failed to update nutrition plan' };
    }
  };

  // Delete a nutrition plan
  const deleteNutritionPlan = async (planId: string) => {
    try {
      if (!nutritionPlans[planId]) {
        return { success: false, error: 'Nutrition plan not found' };
      }
      
      const updatedPlans = { ...nutritionPlans };
      delete updatedPlans[planId];
      
      setNutritionPlans(updatedPlans);
      await saveNutritionPlans(updatedPlans);
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting nutrition plan:', err);
      return { success: false, error: 'Failed to delete nutrition plan' };
    }
  };

  // Create a new hydration plan
  const createHydrationPlan = async (plan: Omit<HydrationPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const id = Date.now().toString();
      
      const newPlan: HydrationPlan = {
        ...plan,
        id,
        createdAt: now,
        updatedAt: now,
        entries: plan.entries || []
      };
      
      const updatedPlans = {
        ...hydrationPlans,
        [id]: newPlan
      };
      
      setHydrationPlans(updatedPlans);
      await saveHydrationPlans(updatedPlans);
      
      return { success: true, planId: id };
    } catch (err) {
      console.error('Error creating hydration plan:', err);
      return { success: false, error: 'Failed to create hydration plan' };
    }
  };

  // Update an existing hydration plan
  const updateHydrationPlan = async (planId: string, plan: Partial<HydrationPlan>) => {
    try {
      if (!hydrationPlans[planId]) {
        return { success: false, error: 'Hydration plan not found' };
      }
      
      const updatedPlan: HydrationPlan = {
        ...hydrationPlans[planId],
        ...plan,
        updatedAt: new Date().toISOString()
      };
      
      const updatedPlans = {
        ...hydrationPlans,
        [planId]: updatedPlan
      };
      
      setHydrationPlans(updatedPlans);
      await saveHydrationPlans(updatedPlans);
      
      return { success: true };
    } catch (err) {
      console.error('Error updating hydration plan:', err);
      return { success: false, error: 'Failed to update hydration plan' };
    }
  };

  // Delete a hydration plan
  const deleteHydrationPlan = async (planId: string) => {
    try {
      if (!hydrationPlans[planId]) {
        return { success: false, error: 'Hydration plan not found' };
      }
      
      const updatedPlans = { ...hydrationPlans };
      delete updatedPlans[planId];
      
      setHydrationPlans(updatedPlans);
      await saveHydrationPlans(updatedPlans);
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting hydration plan:', err);
      return { success: false, error: 'Failed to delete hydration plan' };
    }
  };

  // Add a nutrition entry to a plan
  const addNutritionEntry = async (planId: string, entry: Omit<NutritionEntry, 'id'>) => {
    try {
      if (!nutritionPlans[planId]) {
        return { success: false, error: 'Nutrition plan not found' };
      }
      
      const entryId = Date.now().toString();
      const newEntry: NutritionEntry = {
        ...entry,
        id: entryId
      };
      
      const updatedPlan: NutritionPlan = {
        ...nutritionPlans[planId],
        entries: [...nutritionPlans[planId].entries, newEntry],
        updatedAt: new Date().toISOString()
      };
      
      const updatedPlans = {
        ...nutritionPlans,
        [planId]: updatedPlan
      };
      
      setNutritionPlans(updatedPlans);
      await saveNutritionPlans(updatedPlans);
      
      return { success: true, entryId };
    } catch (err) {
      console.error('Error adding nutrition entry:', err);
      return { success: false, error: 'Failed to add nutrition entry' };
    }
  };

  // Update a nutrition entry
  const updateNutritionEntry = async (planId: string, entryId: string, entry: Partial<NutritionEntry>) => {
    try {
      if (!nutritionPlans[planId]) {
        return { success: false, error: 'Nutrition plan not found' };
      }
      
      const entryIndex = nutritionPlans[planId].entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        return { success: false, error: 'Nutrition entry not found' };
      }
      
      const updatedEntries = [...nutritionPlans[planId].entries];
      updatedEntries[entryIndex] = {
        ...updatedEntries[entryIndex],
        ...entry
      };
      
      const updatedPlan: NutritionPlan = {
        ...nutritionPlans[planId],
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };
      
      const updatedPlans = {
        ...nutritionPlans,
        [planId]: updatedPlan
      };
      
      setNutritionPlans(updatedPlans);
      await saveNutritionPlans(updatedPlans);
      
      return { success: true };
    } catch (err) {
      console.error('Error updating nutrition entry:', err);
      return { success: false, error: 'Failed to update nutrition entry' };
    }
  };

  // Delete a nutrition entry
  const deleteNutritionEntry = async (planId: string, entryId: string) => {
    try {
      if (!nutritionPlans[planId]) {
        return { success: false, error: 'Nutrition plan not found' };
      }
      
      const updatedEntries = nutritionPlans[planId].entries.filter(e => e.id !== entryId);
      
      const updatedPlan: NutritionPlan = {
        ...nutritionPlans[planId],
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };
      
      const updatedPlans = {
        ...nutritionPlans,
        [planId]: updatedPlan
      };
      
      setNutritionPlans(updatedPlans);
      await saveNutritionPlans(updatedPlans);
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting nutrition entry:', err);
      return { success: false, error: 'Failed to delete nutrition entry' };
    }
  };

  // Add a hydration entry to a plan
  const addHydrationEntry = async (planId: string, entry: Omit<HydrationEntry, 'id'>) => {
    try {
      if (!hydrationPlans[planId]) {
        return { success: false, error: 'Hydration plan not found' };
      }
      
      const entryId = Date.now().toString();
      const newEntry: HydrationEntry = {
        ...entry,
        id: entryId
      };
      
      const updatedPlan: HydrationPlan = {
        ...hydrationPlans[planId],
        entries: [...hydrationPlans[planId].entries, newEntry],
        updatedAt: new Date().toISOString()
      };
      
      const updatedPlans = {
        ...hydrationPlans,
        [planId]: updatedPlan
      };
      
      setHydrationPlans(updatedPlans);
      await saveHydrationPlans(updatedPlans);
      
      return { success: true, entryId };
    } catch (err) {
      console.error('Error adding hydration entry:', err);
      return { success: false, error: 'Failed to add hydration entry' };
    }
  };

  // Update a hydration entry
  const updateHydrationEntry = async (planId: string, entryId: string, entry: Partial<HydrationEntry>) => {
    try {
      if (!hydrationPlans[planId]) {
        return { success: false, error: 'Hydration plan not found' };
      }
      
      const entryIndex = hydrationPlans[planId].entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        return { success: false, error: 'Hydration entry not found' };
      }
      
      const updatedEntries = [...hydrationPlans[planId].entries];
      updatedEntries[entryIndex] = {
        ...updatedEntries[entryIndex],
        ...entry
      };
      
      const updatedPlan: HydrationPlan = {
        ...hydrationPlans[planId],
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };
      
      const updatedPlans = {
        ...hydrationPlans,
        [planId]: updatedPlan
      };
      
      setHydrationPlans(updatedPlans);
      await saveHydrationPlans(updatedPlans);
      
      return { success: true };
    } catch (err) {
      console.error('Error updating hydration entry:', err);
      return { success: false, error: 'Failed to update hydration entry' };
    }
  };

  // Delete a hydration entry
  const deleteHydrationEntry = async (planId: string, entryId: string) => {
    try {
      if (!hydrationPlans[planId]) {
        return { success: false, error: 'Hydration plan not found' };
      }
      
      const updatedEntries = hydrationPlans[planId].entries.filter(e => e.id !== entryId);
      
      const updatedPlan: HydrationPlan = {
        ...hydrationPlans[planId],
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };
      
      const updatedPlans = {
        ...hydrationPlans,
        [planId]: updatedPlan
      };
      
      setHydrationPlans(updatedPlans);
      await saveHydrationPlans(updatedPlans);
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting hydration entry:', err);
      return { success: false, error: 'Failed to delete hydration entry' };
    }
  };
  
  // Get a nutrition plan by ID
  const getNutritionPlan = (planId: string) => {
    return nutritionPlans[planId];
  };
  
  // Get a hydration plan by ID
  const getHydrationPlan = (planId: string) => {
    return hydrationPlans[planId];
  };
  
  // Create a new race plan assignment
  const createRacePlanAssignment = async (assignment: Omit<RacePlanAssignment, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString();
      const id = Date.now().toString();
      
      const newAssignment: RacePlanAssignment = {
        ...assignment,
        id,
        createdAt: now,
        updatedAt: now
      };
      
      const updatedAssignments = {
        ...racePlanAssignments,
        [id]: newAssignment
      };
      
      setRacePlanAssignments(updatedAssignments);
      await saveRacePlanAssignments(updatedAssignments);
      
      return { success: true, assignmentId: id };
    } catch (err) {
      console.error('Error creating race plan assignment:', err);
      return { success: false, error: 'Failed to create race plan assignment' };
    }
  };
  
  // Update an existing race plan assignment
  const updateRacePlanAssignment = async (assignmentId: string, assignment: Partial<RacePlanAssignment>) => {
    try {
      if (!racePlanAssignments[assignmentId]) {
        return { success: false, error: 'Race plan assignment not found' };
      }
      
      const updatedAssignment: RacePlanAssignment = {
        ...racePlanAssignments[assignmentId],
        ...assignment,
        updatedAt: new Date().toISOString()
      };
      
      const updatedAssignments = {
        ...racePlanAssignments,
        [assignmentId]: updatedAssignment
      };
      
      setRacePlanAssignments(updatedAssignments);
      await saveRacePlanAssignments(updatedAssignments);
      
      return { success: true };
    } catch (err) {
      console.error('Error updating race plan assignment:', err);
      return { success: false, error: 'Failed to update race plan assignment' };
    }
  };
  
  // Delete a race plan assignment
  const deleteRacePlanAssignment = async (assignmentId: string) => {
    try {
      if (!racePlanAssignments[assignmentId]) {
        return { success: false, error: 'Race plan assignment not found' };
      }
      
      const updatedAssignments = { ...racePlanAssignments };
      delete updatedAssignments[assignmentId];
      
      setRacePlanAssignments(updatedAssignments);
      await saveRacePlanAssignments(updatedAssignments);
      
      return { success: true };
    } catch (err) {
      console.error('Error deleting race plan assignment:', err);
      return { success: false, error: 'Failed to delete race plan assignment' };
    }
  };
  
  // Get race plan assignments by race ID
  const getRacePlanAssignmentsByRaceId = (raceId: string) => {
    return Object.values(racePlanAssignments).filter(
      assignment => assignment.raceId === raceId
    );
  };

  const getNutritionPlan = useCallback((planId: string) => {
    return nutritionPlans[planId];
  }, [nutritionPlans]);

  return (
    <NutritionHydrationContext.Provider
      value={{
        nutritionPlans,
        hydrationPlans,
        racePlanAssignments,
        loading,
        error,
        createNutritionPlan,
        updateNutritionPlan,
        deleteNutritionPlan,
        createHydrationPlan,
        updateHydrationPlan,
        deleteHydrationPlan,
        addNutritionEntry,
        updateNutritionEntry,
        deleteNutritionEntry,
        addHydrationEntry,
        updateHydrationEntry,
        deleteHydrationEntry,
        getNutritionPlan,
        getHydrationPlan,
        createRacePlanAssignment,
        updateRacePlanAssignment,
        deleteRacePlanAssignment,
        getRacePlanAssignmentsByRaceId
      }}
    >
      {children}
    </NutritionHydrationContext.Provider>
  );
};

// Custom hook to use the nutrition/hydration context
export const useNutritionHydration = (): NutritionHydrationContextType => {
  const context = useContext(NutritionHydrationContext);
  if (context === undefined) {
    throw new Error('useNutritionHydration must be used within a NutritionHydrationProvider');
  }
  return context;
};
