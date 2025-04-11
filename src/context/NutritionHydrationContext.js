import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupabase } from './SupabaseContext';

// Create context
const NutritionHydrationContext = createContext();

// Simple UUID generator for React Native
const generateUUID = () => {
  // RFC4122 version 4 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const NutritionHydrationProvider = ({ children }) => {
  const { supabase, user, isPremium } = useSupabase();
  const [nutritionPlans, setNutritionPlans] = useState({});
  const [hydrationPlans, setHydrationPlans] = useState({});
  const [racePlans, setRacePlans] = useState({});
  const [loading, setLoading] = useState(true);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedNutritionPlans = await AsyncStorage.getItem('nutritionPlans');
        const storedHydrationPlans = await AsyncStorage.getItem('hydrationPlans');
        const storedRacePlans = await AsyncStorage.getItem('racePlans');

        if (storedNutritionPlans) {
          setNutritionPlans(JSON.parse(storedNutritionPlans));
        }
        if (storedHydrationPlans) {
          setHydrationPlans(JSON.parse(storedHydrationPlans));
        }
        if (storedRacePlans) {
          setRacePlans(JSON.parse(storedRacePlans));
        }
      } catch (error) {
        console.error('Error loading nutrition and hydration data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('nutritionPlans', JSON.stringify(nutritionPlans));
        await AsyncStorage.setItem('hydrationPlans', JSON.stringify(hydrationPlans));
        await AsyncStorage.setItem('racePlans', JSON.stringify(racePlans));
      } catch (error) {
        console.error('Error saving nutrition and hydration data:', error);
      }
    };

    if (!loading) {
      saveData();
    }
  }, [nutritionPlans, hydrationPlans, racePlans, loading]);

  // Helper function to get or create a UUID mapping
  const getOrCreateUuidMapping = async (localId, type) => {
    try {
      // Try to get existing mapping from AsyncStorage
      const mappingKey = `${type}_uuid_${localId}`;
      const existingMapping = await AsyncStorage.getItem(mappingKey);
      
      if (existingMapping) {
        return existingMapping;
      }
      
      // If no mapping exists, create a new UUID
      const newUuid = generateUUID();
      await AsyncStorage.setItem(mappingKey, newUuid);
      return newUuid;
    } catch (error) {
      console.error(`Error getting or creating UUID mapping for ${type}:`, error);
      // Fallback to creating a new UUID if there's an error
      return generateUUID();
    }
  };

  // NUTRITION PLAN FUNCTIONS

  // Create a new nutrition plan
  const createNutritionPlan = async (planData) => {
    try {
      const newPlanId = generateUUID();
      const newPlan = {
        ...planData,
        id: newPlanId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entries: []
      };

      setNutritionPlans(prevPlans => ({
        ...prevPlans,
        [newPlanId]: newPlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveNutritionPlanToSupabase(newPlan);
      }

      return { success: true, planId: newPlanId };
    } catch (error) {
      console.error('Error creating nutrition plan:', error);
      return { success: false, error: error.message };
    }
  };

  // Get a nutrition plan by ID
  const getNutritionPlan = (planId) => {
    return nutritionPlans[planId];
  };

  // Update a nutrition plan
  const updateNutritionPlan = async (planId, planData) => {
    try {
      const existingPlan = nutritionPlans[planId];
      if (!existingPlan) {
        throw new Error('Nutrition plan not found');
      }

      const updatedPlan = {
        ...existingPlan,
        ...planData,
        updatedAt: new Date().toISOString()
      };

      setNutritionPlans(prevPlans => ({
        ...prevPlans,
        [planId]: updatedPlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveNutritionPlanToSupabase(updatedPlan);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating nutrition plan:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete a nutrition plan
  const deleteNutritionPlan = async (planId) => {
    try {
      // Check if plan exists
      if (!nutritionPlans[planId]) {
        throw new Error('Nutrition plan not found');
      }

      // Create a copy of the current plans and remove the specified plan
      const updatedPlans = { ...nutritionPlans };
      delete updatedPlans[planId];
      setNutritionPlans(updatedPlans);

      // If user is premium, delete from Supabase
      if (isPremium && user && supabase) {
        const supabasePlanId = await getOrCreateUuidMapping(planId, 'nutrition_plan');
        await supabase
          .from('nutrition_plans')
          .delete()
          .eq('id', supabasePlanId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting nutrition plan:', error);
      return { success: false, error: error.message };
    }
  };

  // Add an entry to a nutrition plan
  const addNutritionEntry = async (planId, entryData) => {
    try {
      const plan = nutritionPlans[planId];
      if (!plan) {
        throw new Error('Nutrition plan not found');
      }

      const newEntryId = generateUUID();
      const newEntry = {
        ...entryData,
        id: newEntryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedPlan = {
        ...plan,
        entries: [...(plan.entries || []), newEntry],
        updatedAt: new Date().toISOString()
      };

      setNutritionPlans(prevPlans => ({
        ...prevPlans,
        [planId]: updatedPlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveNutritionEntryToSupabase(planId, newEntry);
      }

      return { success: true, entryId: newEntryId };
    } catch (error) {
      console.error('Error adding nutrition entry:', error);
      return { success: false, error: error.message };
    }
  };

  // Update a nutrition entry
  const updateNutritionEntry = async (planId, entryId, entryData) => {
    try {
      const plan = nutritionPlans[planId];
      if (!plan) {
        throw new Error('Nutrition plan not found');
      }

      const entryIndex = plan.entries.findIndex(entry => entry.id === entryId);
      if (entryIndex === -1) {
        throw new Error('Nutrition entry not found');
      }

      const updatedEntries = [...plan.entries];
      updatedEntries[entryIndex] = {
        ...updatedEntries[entryIndex],
        ...entryData,
        updatedAt: new Date().toISOString()
      };

      const updatedPlan = {
        ...plan,
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };

      setNutritionPlans(prevPlans => ({
        ...prevPlans,
        [planId]: updatedPlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveNutritionEntryToSupabase(planId, updatedEntries[entryIndex]);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating nutrition entry:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete a nutrition entry
  const deleteNutritionEntry = async (planId, entryId) => {
    try {
      const plan = nutritionPlans[planId];
      if (!plan) {
        throw new Error('Nutrition plan not found');
      }

      const updatedEntries = plan.entries.filter(entry => entry.id !== entryId);
      
      const updatedPlan = {
        ...plan,
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };

      setNutritionPlans(prevPlans => ({
        ...prevPlans,
        [planId]: updatedPlan
      }));

      // If user is premium, delete from Supabase
      if (isPremium && user && supabase) {
        const supabaseEntryId = await getOrCreateUuidMapping(entryId, 'nutrition_entry');
        await supabase
          .from('nutrition_entries')
          .delete()
          .eq('id', supabaseEntryId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting nutrition entry:', error);
      return { success: false, error: error.message };
    }
  };

  // HYDRATION PLAN FUNCTIONS

  // Create a new hydration plan
  const createHydrationPlan = async (planData) => {
    try {
      const newPlanId = generateUUID();
      const newPlan = {
        ...planData,
        id: newPlanId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entries: []
      };

      setHydrationPlans(prevPlans => ({
        ...prevPlans,
        [newPlanId]: newPlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveHydrationPlanToSupabase(newPlan);
      }

      return { success: true, planId: newPlanId };
    } catch (error) {
      console.error('Error creating hydration plan:', error);
      return { success: false, error: error.message };
    }
  };

  // Get a hydration plan by ID
  const getHydrationPlan = (planId) => {
    return hydrationPlans[planId];
  };

  // Update a hydration plan
  const updateHydrationPlan = async (planId, planData) => {
    try {
      const existingPlan = hydrationPlans[planId];
      if (!existingPlan) {
        throw new Error('Hydration plan not found');
      }

      const updatedPlan = {
        ...existingPlan,
        ...planData,
        updatedAt: new Date().toISOString()
      };

      setHydrationPlans(prevPlans => ({
        ...prevPlans,
        [planId]: updatedPlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveHydrationPlanToSupabase(updatedPlan);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating hydration plan:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete a hydration plan
  const deleteHydrationPlan = async (planId) => {
    try {
      // Check if plan exists
      if (!hydrationPlans[planId]) {
        throw new Error('Hydration plan not found');
      }

      // Create a copy of the current plans and remove the specified plan
      const updatedPlans = { ...hydrationPlans };
      delete updatedPlans[planId];
      setHydrationPlans(updatedPlans);

      // If user is premium, delete from Supabase
      if (isPremium && user && supabase) {
        const supabasePlanId = await getOrCreateUuidMapping(planId, 'hydration_plan');
        await supabase
          .from('hydration_plans')
          .delete()
          .eq('id', supabasePlanId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting hydration plan:', error);
      return { success: false, error: error.message };
    }
  };

  // Add an entry to a hydration plan
  const addHydrationEntry = async (planId, entryData) => {
    try {
      const plan = hydrationPlans[planId];
      if (!plan) {
        throw new Error('Hydration plan not found');
      }

      const newEntryId = generateUUID();
      const newEntry = {
        ...entryData,
        id: newEntryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedPlan = {
        ...plan,
        entries: [...(plan.entries || []), newEntry],
        updatedAt: new Date().toISOString()
      };

      setHydrationPlans(prevPlans => ({
        ...prevPlans,
        [planId]: updatedPlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveHydrationEntryToSupabase(planId, newEntry);
      }

      return { success: true, entryId: newEntryId };
    } catch (error) {
      console.error('Error adding hydration entry:', error);
      return { success: false, error: error.message };
    }
  };

  // Update a hydration entry
  const updateHydrationEntry = async (planId, entryId, entryData) => {
    try {
      const plan = hydrationPlans[planId];
      if (!plan) {
        throw new Error('Hydration plan not found');
      }

      const entryIndex = plan.entries.findIndex(entry => entry.id === entryId);
      if (entryIndex === -1) {
        throw new Error('Hydration entry not found');
      }

      const updatedEntries = [...plan.entries];
      updatedEntries[entryIndex] = {
        ...updatedEntries[entryIndex],
        ...entryData,
        updatedAt: new Date().toISOString()
      };

      const updatedPlan = {
        ...plan,
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };

      setHydrationPlans(prevPlans => ({
        ...prevPlans,
        [planId]: updatedPlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveHydrationEntryToSupabase(planId, updatedEntries[entryIndex]);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating hydration entry:', error);
      return { success: false, error: error.message };
    }
  };

  // Delete a hydration entry
  const deleteHydrationEntry = async (planId, entryId) => {
    try {
      const plan = hydrationPlans[planId];
      if (!plan) {
        throw new Error('Hydration plan not found');
      }

      const updatedEntries = plan.entries.filter(entry => entry.id !== entryId);
      
      const updatedPlan = {
        ...plan,
        entries: updatedEntries,
        updatedAt: new Date().toISOString()
      };

      setHydrationPlans(prevPlans => ({
        ...prevPlans,
        [planId]: updatedPlan
      }));

      // If user is premium, delete from Supabase
      if (isPremium && user && supabase) {
        const supabaseEntryId = await getOrCreateUuidMapping(entryId, 'hydration_entry');
        await supabase
          .from('hydration_entries')
          .delete()
          .eq('id', supabaseEntryId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting hydration entry:', error);
      return { success: false, error: error.message };
    }
  };

  // RACE PLAN FUNCTIONS

  // Associate plans with a race
  const associatePlansWithRace = async (raceId, nutritionPlanId, hydrationPlanId) => {
    try {
      const newRacePlanId = generateUUID();
      const newRacePlan = {
        id: newRacePlanId,
        raceId,
        nutritionPlanId,
        hydrationPlanId,
        startTime: new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setRacePlans(prevPlans => ({
        ...prevPlans,
        [newRacePlanId]: newRacePlan
      }));

      // If user is premium, save to Supabase
      if (isPremium && user && supabase) {
        await saveRacePlanToSupabase(newRacePlan);
      }

      return { success: true, racePlanId: newRacePlanId };
    } catch (error) {
      console.error('Error associating plans with race:', error);
      return { success: false, error: error.message };
    }
  };

  // Get plans associated with a race
  const getPlansForRace = (raceId) => {
    const associatedPlans = Object.values(racePlans).filter(plan => plan.raceId === raceId);
    return associatedPlans;
  };

  // TEMPLATE FUNCTIONS

  // Get nutrition plan templates
  const getNutritionPlanTemplates = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
        
      if (error) throw error;
      
      return { success: true, templates: data };
    } catch (error) {
      console.error('Error fetching nutrition plan templates:', error);
      return { success: false, error: error.message };
    }
  };

  // Get hydration plan templates
  const getHydrationPlanTemplates = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('hydration_plans')
        .select('*')
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
        
      if (error) throw error;
      
      return { success: true, templates: data };
    } catch (error) {
      console.error('Error fetching hydration plan templates:', error);
      return { success: false, error: error.message };
    }
  };

  // Create plan from template
  const createPlanFromTemplate = async (templateId, planType, customData = {}) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      // Fetch template data
      const { data: templateData, error } = await supabase
        .from(planType === 'nutrition' ? 'nutrition_plans' : 'hydration_plans')
        .select('*')
        .eq('id', templateId)
        .single();
        
      if (error) throw error;
      
      // Create new plan based on template
      const newPlanData = {
        name: `${templateData.name} (Copy)`,
        description: templateData.description,
        raceType: templateData.race_type,
        raceDuration: templateData.race_duration,
        terrainType: templateData.terrain_type,
        weatherCondition: templateData.weather_condition,
        intensityLevel: templateData.intensity_level,
        ...customData
      };
      
      // Create the new plan
      let result;
      if (planType === 'nutrition') {
        result = await createNutritionPlan(newPlanData);
      } else {
        result = await createHydrationPlan(newPlanData);
      }
      
      if (!result.success) throw new Error(result.error);
      
      // Fetch template entries
      const { data: templateEntries, error: entriesError } = await supabase
        .from(planType === 'nutrition' ? 'nutrition_entries' : 'hydration_entries')
        .select('*')
        .eq('plan_id', templateId);
        
      if (entriesError) throw entriesError;
      
      // Add entries to the new plan
      for (const entry of templateEntries) {
        const entryData = planType === 'nutrition' 
          ? {
              foodType: entry.food_type,
              calories: entry.calories,
              carbs: entry.carbs,
              protein: entry.protein,
              fat: entry.fat,
              timing: entry.timing,
              frequency: entry.frequency,
              quantity: entry.quantity,
              sodium: entry.sodium,
              potassium: entry.potassium,
              magnesium: entry.magnesium,
              isEssential: entry.is_essential,
              sourceLocation: entry.source_location,
              notes: entry.notes
            }
          : {
              liquidType: entry.liquid_type,
              volume: entry.volume,
              electrolytes: entry.electrolytes,
              timing: entry.timing,
              frequency: entry.frequency,
              consumptionRate: entry.consumption_rate,
              temperature: entry.temperature,
              sourceLocation: entry.source_location,
              containerType: entry.container_type
            };
            
        if (planType === 'nutrition') {
          await addNutritionEntry(result.planId, entryData);
        } else {
          await addHydrationEntry(result.planId, entryData);
        }
      }
      
      return { success: true, planId: result.planId };
    } catch (error) {
      console.error(`Error creating ${planType} plan from template:`, error);
      return { success: false, error: error.message };
    }
  };

  // SUPABASE SYNC FUNCTIONS

  // Save nutrition plan to Supabase
  const saveNutritionPlanToSupabase = async (plan) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      // Get UUID mapping for this plan ID
      const supabasePlanId = await getOrCreateUuidMapping(plan.id, 'nutrition_plan');
      
      // Check if plan already exists in Supabase
      const { data: existingPlan, error: fetchError } = await supabase
        .from('nutrition_plans')
        .select('id')
        .eq('id', supabasePlanId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      // Format race duration
      const raceDuration = plan.raceDuration ? `${plan.raceDuration} hours` : null;
      
      // Prepare plan data
      const planData = {
        id: supabasePlanId,
        user_id: user.id,
        name: plan.name || 'Unnamed Plan',
        description: plan.description || '',
        race_type: plan.raceType || '',
        race_duration: raceDuration,
        terrain_type: plan.terrainType || '',
        weather_condition: plan.weatherCondition || '',
        intensity_level: plan.intensityLevel || '',
        updated_at: new Date()
      };
      
      // Insert or update plan
      if (existingPlan) {
        // Update existing plan
        const { error: updateError } = await supabase
          .from('nutrition_plans')
          .update(planData)
          .eq('id', supabasePlanId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new plan
        planData.created_at = new Date();
        const { error: insertError } = await supabase
          .from('nutrition_plans')
          .insert(planData);
          
        if (insertError) throw insertError;
      }
      
      // Save entries
      if (plan.entries && plan.entries.length > 0) {
        for (const entry of plan.entries) {
          await saveNutritionEntryToSupabase(plan.id, entry);
        }
      }
      
      return { success: true, supabasePlanId };
    } catch (error) {
      console.error('Error saving nutrition plan to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Save nutrition entry to Supabase
  const saveNutritionEntryToSupabase = async (planId, entry) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      // Get UUID mappings
      const supabasePlanId = await getOrCreateUuidMapping(planId, 'nutrition_plan');
      const supabaseEntryId = await getOrCreateUuidMapping(entry.id, 'nutrition_entry');
      
      // Check if entry already exists in Supabase
      const { data: existingEntry, error: fetchError } = await supabase
        .from('nutrition_entries')
        .select('id')
        .eq('id', supabaseEntryId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      // Prepare entry data
      const entryData = {
        id: supabaseEntryId,
        plan_id: supabasePlanId,
        food_type: entry.foodType || '',
        calories: entry.calories || 0,
        carbs: entry.carbs || 0,
        protein: entry.protein || 0,
        fat: entry.fat || 0,
        timing: entry.timing || '',
        frequency: entry.frequency || '',
        quantity: entry.quantity || 1,
        sodium: entry.sodium || 0,
        potassium: entry.potassium || 0,
        magnesium: entry.magnesium || 0,
        is_essential: entry.isEssential || false,
        source_location: entry.sourceLocation || '',
        notes: entry.notes || '',
        updated_at: new Date()
      };
      
      // Insert or update entry
      if (existingEntry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('nutrition_entries')
          .update(entryData)
          .eq('id', supabaseEntryId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new entry
        entryData.created_at = new Date();
        const { error: insertError } = await supabase
          .from('nutrition_entries')
          .insert(entryData);
          
        if (insertError) throw insertError;
      }
      
      return { success: true, supabaseEntryId };
    } catch (error) {
      console.error('Error saving nutrition entry to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Save hydration plan to Supabase
  const saveHydrationPlanToSupabase = async (plan) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      // Get UUID mapping for this plan ID
      const supabasePlanId = await getOrCreateUuidMapping(plan.id, 'hydration_plan');
      
      // Check if plan already exists in Supabase
      const { data: existingPlan, error: fetchError } = await supabase
        .from('hydration_plans')
        .select('id')
        .eq('id', supabasePlanId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      // Format race duration
      const raceDuration = plan.raceDuration ? `${plan.raceDuration} hours` : null;
      
      // Prepare plan data
      const planData = {
        id: supabasePlanId,
        user_id: user.id,
        name: plan.name || 'Unnamed Plan',
        description: plan.description || '',
        race_type: plan.raceType || '',
        race_duration: raceDuration,
        terrain_type: plan.terrainType || '',
        weather_condition: plan.weatherCondition || '',
        intensity_level: plan.intensityLevel || '',
        updated_at: new Date()
      };
      
      // Insert or update plan
      if (existingPlan) {
        // Update existing plan
        const { error: updateError } = await supabase
          .from('hydration_plans')
          .update(planData)
          .eq('id', supabasePlanId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new plan
        planData.created_at = new Date();
        const { error: insertError } = await supabase
          .from('hydration_plans')
          .insert(planData);
          
        if (insertError) throw insertError;
      }
      
      // Save entries
      if (plan.entries && plan.entries.length > 0) {
        for (const entry of plan.entries) {
          await saveHydrationEntryToSupabase(plan.id, entry);
        }
      }
      
      return { success: true, supabasePlanId };
    } catch (error) {
      console.error('Error saving hydration plan to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Save hydration entry to Supabase
  const saveHydrationEntryToSupabase = async (planId, entry) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      // Get UUID mappings
      const supabasePlanId = await getOrCreateUuidMapping(planId, 'hydration_plan');
      const supabaseEntryId = await getOrCreateUuidMapping(entry.id, 'hydration_entry');
      
      // Check if entry already exists in Supabase
      const { data: existingEntry, error: fetchError } = await supabase
        .from('hydration_entries')
        .select('id')
        .eq('id', supabaseEntryId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      // Prepare entry data
      const entryData = {
        id: supabaseEntryId,
        plan_id: supabasePlanId,
        liquid_type: entry.liquidType || '',
        volume: entry.volume || 0,
        electrolytes: entry.electrolytes || null,
        timing: entry.timing || '',
        frequency: entry.frequency || '',
        consumption_rate: entry.consumptionRate || 0,
        temperature: entry.temperature || '',
        source_location: entry.sourceLocation || '',
        container_type: entry.containerType || '',
        updated_at: new Date()
      };
      
      // Insert or update entry
      if (existingEntry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('hydration_entries')
          .update(entryData)
          .eq('id', supabaseEntryId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new entry
        entryData.created_at = new Date();
        const { error: insertError } = await supabase
          .from('hydration_entries')
          .insert(entryData);
          
        if (insertError) throw insertError;
      }
      
      return { success: true, supabaseEntryId };
    } catch (error) {
      console.error('Error saving hydration entry to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Save race plan to Supabase
  const saveRacePlanToSupabase = async (racePlan) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      // Get UUID mappings
      const supabaseRacePlanId = await getOrCreateUuidMapping(racePlan.id, 'race_plan');
      const supabaseRaceId = await getOrCreateUuidMapping(racePlan.raceId, 'race');
      const supabaseNutritionPlanId = racePlan.nutritionPlanId ? 
        await getOrCreateUuidMapping(racePlan.nutritionPlanId, 'nutrition_plan') : null;
      const supabaseHydrationPlanId = racePlan.hydrationPlanId ? 
        await getOrCreateUuidMapping(racePlan.hydrationPlanId, 'hydration_plan') : null;
      
      // Check if race plan already exists in Supabase
      const { data: existingRacePlan, error: fetchError } = await supabase
        .from('race_plans')
        .select('id')
        .eq('id', supabaseRacePlanId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      // Prepare race plan data
      const racePlanData = {
        id: supabaseRacePlanId,
        race_id: supabaseRaceId,
        nutrition_plan_id: supabaseNutritionPlanId,
        hydration_plan_id: supabaseHydrationPlanId,
        start_time: racePlan.startTime || new Date(),
        end_time: racePlan.endTime || null,
        is_active: racePlan.isActive !== false, // Default to true
        updated_at: new Date()
      };
      
      // Insert or update race plan
      if (existingRacePlan) {
        // Update existing race plan
        const { error: updateError } = await supabase
          .from('race_plans')
          .update(racePlanData)
          .eq('id', supabaseRacePlanId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new race plan
        racePlanData.created_at = new Date();
        const { error: insertError } = await supabase
          .from('race_plans')
          .insert(racePlanData);
          
        if (insertError) throw insertError;
      }
      
      return { success: true, supabaseRacePlanId };
    } catch (error) {
      console.error('Error saving race plan to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch nutrition plans from Supabase
  const fetchNutritionPlansFromSupabase = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      
      // Fetch nutrition plans
      const { data: nutritionPlansData, error: plansError } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('user_id', user.id);
        
      if (plansError) throw plansError;
      
      // Fetch entries for each plan
      const plansWithEntries = {};
      
      for (const plan of nutritionPlansData) {
        // Fetch entries for this plan
        const { data: entriesData, error: entriesError } = await supabase
          .from('nutrition_entries')
          .select('*')
          .eq('plan_id', plan.id);
          
        if (entriesError) throw entriesError;
        
        // Create local ID for the plan
        const localPlanId = generateUUID();
        await AsyncStorage.setItem(`nutrition_plan_uuid_${localPlanId}`, plan.id);
        
        // Format entries
        const formattedEntries = entriesData.map(entry => {
          const localEntryId = generateUUID();
          AsyncStorage.setItem(`nutrition_entry_uuid_${localEntryId}`, entry.id);
          
          return {
            id: localEntryId,
            foodType: entry.food_type,
            calories: entry.calories,
            carbs: entry.carbs,
            protein: entry.protein,
            fat: entry.fat,
            timing: entry.timing,
            frequency: entry.frequency,
            quantity: entry.quantity,
            sodium: entry.sodium,
            potassium: entry.potassium,
            magnesium: entry.magnesium,
            isEssential: entry.is_essential,
            sourceLocation: entry.source_location,
            notes: entry.notes,
            createdAt: entry.created_at,
            updatedAt: entry.updated_at
          };
        });
        
        // Format plan
        plansWithEntries[localPlanId] = {
          id: localPlanId,
          name: plan.name,
          description: plan.description,
          raceType: plan.race_type,
          raceDuration: plan.race_duration,
          terrainType: plan.terrain_type,
          weatherCondition: plan.weather_condition,
          intensityLevel: plan.intensity_level,
          entries: formattedEntries,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at
        };
      }
      
      // Update state with fetched plans
      setNutritionPlans(prevPlans => ({
        ...prevPlans,
        ...plansWithEntries
      }));
      
      return { success: true, plans: plansWithEntries };
    } catch (error) {
      console.error('Error fetching nutrition plans from Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch hydration plans from Supabase
  const fetchHydrationPlansFromSupabase = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      
      // Fetch hydration plans
      const { data: hydrationPlansData, error: plansError } = await supabase
        .from('hydration_plans')
        .select('*')
        .eq('user_id', user.id);
        
      if (plansError) throw plansError;
      
      // Fetch entries for each plan
      const plansWithEntries = {};
      
      for (const plan of hydrationPlansData) {
        // Fetch entries for this plan
        const { data: entriesData, error: entriesError } = await supabase
          .from('hydration_entries')
          .select('*')
          .eq('plan_id', plan.id);
          
        if (entriesError) throw entriesError;
        
        // Create local ID for the plan
        const localPlanId = generateUUID();
        await AsyncStorage.setItem(`hydration_plan_uuid_${localPlanId}`, plan.id);
        
        // Format entries
        const formattedEntries = entriesData.map(entry => {
          const localEntryId = generateUUID();
          AsyncStorage.setItem(`hydration_entry_uuid_${localEntryId}`, entry.id);
          
          return {
            id: localEntryId,
            liquidType: entry.liquid_type,
            volume: entry.volume,
            electrolytes: entry.electrolytes,
            timing: entry.timing,
            frequency: entry.frequency,
            consumptionRate: entry.consumption_rate,
            temperature: entry.temperature,
            sourceLocation: entry.source_location,
            containerType: entry.container_type,
            createdAt: entry.created_at,
            updatedAt: entry.updated_at
          };
        });
        
        // Format plan
        plansWithEntries[localPlanId] = {
          id: localPlanId,
          name: plan.name,
          description: plan.description,
          raceType: plan.race_type,
          raceDuration: plan.race_duration,
          terrainType: plan.terrain_type,
          weatherCondition: plan.weather_condition,
          intensityLevel: plan.intensity_level,
          entries: formattedEntries,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at
        };
      }
      
      // Update state with fetched plans
      setHydrationPlans(prevPlans => ({
        ...prevPlans,
        ...plansWithEntries
      }));
      
      return { success: true, plans: plansWithEntries };
    } catch (error) {
      console.error('Error fetching hydration plans from Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch race plans from Supabase
  const fetchRacePlansFromSupabase = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      
      // Fetch races for this user
      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('id')
        .eq('user_id', user.id);
        
      if (racesError) throw racesError;
      
      if (!racesData || racesData.length === 0) {
        return { success: true, plans: {} }; // No races found
      }
      
      // Get race IDs
      const raceIds = racesData.map(race => race.id);
      
      // Fetch race plans for these races
      const { data: racePlansData, error: plansError } = await supabase
        .from('race_plans')
        .select('*')
        .in('race_id', raceIds);
        
      if (plansError) throw plansError;
      
      // Format race plans
      const formattedRacePlans = {};
      
      for (const plan of racePlansData) {
        // Get local IDs for race, nutrition plan, and hydration plan
        let localRaceId = null;
        let localNutritionPlanId = null;
        let localHydrationPlanId = null;
        
        // Find local race ID
        const raceKeys = await AsyncStorage.getAllKeys();
        for (const key of raceKeys) {
          if (key.startsWith('race_uuid_')) {
            const value = await AsyncStorage.getItem(key);
            if (value === plan.race_id) {
              localRaceId = key.replace('race_uuid_', '');
              break;
            }
          }
        }
        
        // Find local nutrition plan ID
        if (plan.nutrition_plan_id) {
          const nutritionPlanKeys = await AsyncStorage.getAllKeys();
          for (const key of nutritionPlanKeys) {
            if (key.startsWith('nutrition_plan_uuid_')) {
              const value = await AsyncStorage.getItem(key);
              if (value === plan.nutrition_plan_id) {
                localNutritionPlanId = key.replace('nutrition_plan_uuid_', '');
                break;
              }
            }
          }
        }
        
        // Find local hydration plan ID
        if (plan.hydration_plan_id) {
          const hydrationPlanKeys = await AsyncStorage.getAllKeys();
          for (const key of hydrationPlanKeys) {
            if (key.startsWith('hydration_plan_uuid_')) {
              const value = await AsyncStorage.getItem(key);
              if (value === plan.hydration_plan_id) {
                localHydrationPlanId = key.replace('hydration_plan_uuid_', '');
                break;
              }
            }
          }
        }
        
        // Create local ID for the race plan
        const localRacePlanId = generateUUID();
        await AsyncStorage.setItem(`race_plan_uuid_${localRacePlanId}`, plan.id);
        
        // Add to formatted race plans
        formattedRacePlans[localRacePlanId] = {
          id: localRacePlanId,
          raceId: localRaceId,
          nutritionPlanId: localNutritionPlanId,
          hydrationPlanId: localHydrationPlanId,
          startTime: plan.start_time,
          endTime: plan.end_time,
          isActive: plan.is_active,
          createdAt: plan.created_at,
          updatedAt: plan.updated_at
        };
      }
      
      // Update state with fetched race plans
      setRacePlans(prevPlans => ({
        ...prevPlans,
        ...formattedRacePlans
      }));
      
      return { success: true, plans: formattedRacePlans };
    } catch (error) {
      console.error('Error fetching race plans from Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Sync all data with Supabase
  const syncWithSupabase = async () => {
    try {
      if (!isPremium) {
        return { success: false, error: 'Premium subscription required for Supabase sync' };
      }
      
      // Fetch data from Supabase
      await fetchNutritionPlansFromSupabase();
      await fetchHydrationPlansFromSupabase();
      await fetchRacePlansFromSupabase();
      
      // Save local data to Supabase
      for (const planId in nutritionPlans) {
        await saveNutritionPlanToSupabase(nutritionPlans[planId]);
      }
      
      for (const planId in hydrationPlans) {
        await saveHydrationPlanToSupabase(hydrationPlans[planId]);
      }
      
      for (const planId in racePlans) {
        await saveRacePlanToSupabase(racePlans[planId]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <NutritionHydrationContext.Provider
      value={{
        nutritionPlans,
        hydrationPlans,
        racePlans,
        loading,
        // Nutrition plan functions
        createNutritionPlan,
        getNutritionPlan,
        updateNutritionPlan,
        deleteNutritionPlan,
        addNutritionEntry,
        updateNutritionEntry,
        deleteNutritionEntry,
        // Hydration plan functions
        createHydrationPlan,
        getHydrationPlan,
        updateHydrationPlan,
        deleteHydrationPlan,
        addHydrationEntry,
        updateHydrationEntry,
        deleteHydrationEntry,
        // Race plan functions
        associatePlansWithRace,
        getPlansForRace,
        // Template functions
        getNutritionPlanTemplates,
        getHydrationPlanTemplates,
        createPlanFromTemplate,
        // Sync functions
        syncWithSupabase,
        fetchNutritionPlansFromSupabase,
        fetchHydrationPlansFromSupabase,
        fetchRacePlansFromSupabase
      }}
    >
      {children}
    </NutritionHydrationContext.Provider>
  );
};

// Custom hook to use the NutritionHydration context
export const useNutritionHydration = () => {
  const context = useContext(NutritionHydrationContext);
  if (!context) {
    throw new Error('useNutritionHydration must be used within a NutritionHydrationProvider');
  }
  return context;
};