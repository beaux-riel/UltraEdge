import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default Supabase URL and anon key (these should match the ones in SupabaseContext.js)
const SUPABASE_URL = "https://tybnspiyravdizljzrxw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym5zcGl5cmF2ZGl6bGp6cnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDI4MDksImV4cCI6MjA1OTYxODgwOX0.WrA-XgzKifmw0NZqxkjM2MHCBWSHGWWcsgIawc9dlMQ";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// NUTRITION PLAN API

// Get all nutrition plans
export const getAllNutritionPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching nutrition plans:', error);
    return { success: false, error: error.message };
  }
};

// Get nutrition plan by ID
export const getNutritionPlanById = async (planId) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (error) throw error;
    
    // Get entries for this plan
    const { data: entries, error: entriesError } = await supabase
      .from('nutrition_entries')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true });
      
    if (entriesError) throw entriesError;
    
    return { success: true, data: { ...data, entries } };
  } catch (error) {
    console.error('Error fetching nutrition plan:', error);
    return { success: false, error: error.message };
  }
};

// Create nutrition plan
export const createNutritionPlan = async (planData) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .insert([{
        user_id: planData.userId,
        name: planData.name,
        description: planData.description,
        race_type: planData.raceType,
        race_duration: planData.raceDuration,
        terrain_type: planData.terrainType,
        weather_condition: planData.weatherCondition,
        intensity_level: planData.intensityLevel
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    return { success: false, error: error.message };
  }
};

// Update nutrition plan
export const updateNutritionPlan = async (planId, planData) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .update({
        name: planData.name,
        description: planData.description,
        race_type: planData.raceType,
        race_duration: planData.raceDuration,
        terrain_type: planData.terrainType,
        weather_condition: planData.weatherCondition,
        intensity_level: planData.intensityLevel
      })
      .eq('id', planId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating nutrition plan:', error);
    return { success: false, error: error.message };
  }
};

// Delete nutrition plan
export const deleteNutritionPlan = async (planId) => {
  try {
    const { error } = await supabase
      .from('nutrition_plans')
      .delete()
      .eq('id', planId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting nutrition plan:', error);
    return { success: false, error: error.message };
  }
};

// Create nutrition entry
export const createNutritionEntry = async (planId, entryData) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_entries')
      .insert([{
        plan_id: planId,
        food_type: entryData.foodType,
        calories: entryData.calories,
        carbs: entryData.carbs,
        protein: entryData.protein,
        fat: entryData.fat,
        timing: entryData.timing,
        frequency: entryData.frequency,
        quantity: entryData.quantity,
        sodium: entryData.sodium,
        potassium: entryData.potassium,
        magnesium: entryData.magnesium,
        is_essential: entryData.isEssential,
        source_location: entryData.sourceLocation,
        notes: entryData.notes
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating nutrition entry:', error);
    return { success: false, error: error.message };
  }
};

// Update nutrition entry
export const updateNutritionEntry = async (entryId, entryData) => {
  try {
    const { data, error } = await supabase
      .from('nutrition_entries')
      .update({
        food_type: entryData.foodType,
        calories: entryData.calories,
        carbs: entryData.carbs,
        protein: entryData.protein,
        fat: entryData.fat,
        timing: entryData.timing,
        frequency: entryData.frequency,
        quantity: entryData.quantity,
        sodium: entryData.sodium,
        potassium: entryData.potassium,
        magnesium: entryData.magnesium,
        is_essential: entryData.isEssential,
        source_location: entryData.sourceLocation,
        notes: entryData.notes
      })
      .eq('id', entryId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating nutrition entry:', error);
    return { success: false, error: error.message };
  }
};

// Delete nutrition entry
export const deleteNutritionEntry = async (entryId) => {
  try {
    const { error } = await supabase
      .from('nutrition_entries')
      .delete()
      .eq('id', entryId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting nutrition entry:', error);
    return { success: false, error: error.message };
  }
};

// HYDRATION PLAN API

// Get all hydration plans
export const getAllHydrationPlans = async () => {
  try {
    const { data, error } = await supabase
      .from('hydration_plans')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching hydration plans:', error);
    return { success: false, error: error.message };
  }
};

// Get hydration plan by ID
export const getHydrationPlanById = async (planId) => {
  try {
    const { data, error } = await supabase
      .from('hydration_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (error) throw error;
    
    // Get entries for this plan
    const { data: entries, error: entriesError } = await supabase
      .from('hydration_entries')
      .select('*')
      .eq('plan_id', planId)
      .order('created_at', { ascending: true });
      
    if (entriesError) throw entriesError;
    
    return { success: true, data: { ...data, entries } };
  } catch (error) {
    console.error('Error fetching hydration plan:', error);
    return { success: false, error: error.message };
  }
};

// Create hydration plan
export const createHydrationPlan = async (planData) => {
  try {
    const { data, error } = await supabase
      .from('hydration_plans')
      .insert([{
        user_id: planData.userId,
        name: planData.name,
        description: planData.description,
        race_type: planData.raceType,
        race_duration: planData.raceDuration,
        terrain_type: planData.terrainType,
        weather_condition: planData.weatherCondition,
        intensity_level: planData.intensityLevel
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating hydration plan:', error);
    return { success: false, error: error.message };
  }
};

// Update hydration plan
export const updateHydrationPlan = async (planId, planData) => {
  try {
    const { data, error } = await supabase
      .from('hydration_plans')
      .update({
        name: planData.name,
        description: planData.description,
        race_type: planData.raceType,
        race_duration: planData.raceDuration,
        terrain_type: planData.terrainType,
        weather_condition: planData.weatherCondition,
        intensity_level: planData.intensityLevel
      })
      .eq('id', planId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating hydration plan:', error);
    return { success: false, error: error.message };
  }
};

// Delete hydration plan
export const deleteHydrationPlan = async (planId) => {
  try {
    const { error } = await supabase
      .from('hydration_plans')
      .delete()
      .eq('id', planId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting hydration plan:', error);
    return { success: false, error: error.message };
  }
};

// Create hydration entry
export const createHydrationEntry = async (planId, entryData) => {
  try {
    const { data, error } = await supabase
      .from('hydration_entries')
      .insert([{
        plan_id: planId,
        liquid_type: entryData.liquidType,
        volume: entryData.volume,
        electrolytes: entryData.electrolytes,
        timing: entryData.timing,
        frequency: entryData.frequency,
        consumption_rate: entryData.consumptionRate,
        temperature: entryData.temperature,
        source_location: entryData.sourceLocation,
        container_type: entryData.containerType
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating hydration entry:', error);
    return { success: false, error: error.message };
  }
};

// Update hydration entry
export const updateHydrationEntry = async (entryId, entryData) => {
  try {
    const { data, error } = await supabase
      .from('hydration_entries')
      .update({
        liquid_type: entryData.liquidType,
        volume: entryData.volume,
        electrolytes: entryData.electrolytes,
        timing: entryData.timing,
        frequency: entryData.frequency,
        consumption_rate: entryData.consumptionRate,
        temperature: entryData.temperature,
        source_location: entryData.sourceLocation,
        container_type: entryData.containerType
      })
      .eq('id', entryId)
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error updating hydration entry:', error);
    return { success: false, error: error.message };
  }
};

// Delete hydration entry
export const deleteHydrationEntry = async (entryId) => {
  try {
    const { error } = await supabase
      .from('hydration_entries')
      .delete()
      .eq('id', entryId);
      
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting hydration entry:', error);
    return { success: false, error: error.message };
  }
};

// RACE PLAN API

// Associate plans with a race
export const associatePlansWithRace = async (raceId, nutritionPlanId, hydrationPlanId) => {
  try {
    const { data, error } = await supabase
      .from('race_plans')
      .insert([{
        race_id: raceId,
        nutrition_plan_id: nutritionPlanId,
        hydration_plan_id: hydrationPlanId,
        start_time: new Date(),
        is_active: true
      }])
      .select()
      .single();
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error associating plans with race:', error);
    return { success: false, error: error.message };
  }
};

// Get plans associated with a race
export const getPlansForRace = async (raceId) => {
  try {
    const { data, error } = await supabase
      .from('race_plans')
      .select(`
        id,
        race_id,
        nutrition_plan_id,
        hydration_plan_id,
        start_time,
        end_time,
        is_active,
        created_at,
        updated_at
      `)
      .eq('race_id', raceId);
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching plans for race:', error);
    return { success: false, error: error.message };
  }
};

// TEMPLATE API

// Get nutrition plan templates
export const getNutritionPlanTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('user_id', '00000000-0000-0000-0000-000000000000');
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching nutrition plan templates:', error);
    return { success: false, error: error.message };
  }
};

// Get hydration plan templates
export const getHydrationPlanTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('hydration_plans')
      .select('*')
      .eq('user_id', '00000000-0000-0000-0000-000000000000');
      
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching hydration plan templates:', error);
    return { success: false, error: error.message };
  }
};

// Create plan from template
export const createPlanFromTemplate = async (templateId, planType, userId, customData = {}) => {
  try {
    // Fetch template data
    const { data: templateData, error } = await supabase
      .from(planType === 'nutrition' ? 'nutrition_plans' : 'hydration_plans')
      .select('*')
      .eq('id', templateId)
      .single();
      
    if (error) throw error;
    
    // Create new plan based on template
    const { data: newPlan, error: createError } = await supabase
      .from(planType === 'nutrition' ? 'nutrition_plans' : 'hydration_plans')
      .insert([{
        user_id: userId,
        name: `${templateData.name} (Copy)`,
        description: templateData.description,
        race_type: templateData.race_type,
        race_duration: templateData.race_duration,
        terrain_type: templateData.terrain_type,
        weather_condition: templateData.weather_condition,
        intensity_level: templateData.intensity_level,
        ...customData
      }])
      .select()
      .single();
      
    if (createError) throw createError;
    
    // Fetch template entries
    const { data: templateEntries, error: entriesError } = await supabase
      .from(planType === 'nutrition' ? 'nutrition_entries' : 'hydration_entries')
      .select('*')
      .eq('plan_id', templateId);
      
    if (entriesError) throw entriesError;
    
    // Add entries to the new plan
    if (templateEntries && templateEntries.length > 0) {
      const entriesData = templateEntries.map(entry => {
        const newEntry = { ...entry };
        delete newEntry.id;
        delete newEntry.created_at;
        delete newEntry.updated_at;
        newEntry.plan_id = newPlan.id;
        return newEntry;
      });
      
      const { error: insertEntriesError } = await supabase
        .from(planType === 'nutrition' ? 'nutrition_entries' : 'hydration_entries')
        .insert(entriesData);
        
      if (insertEntriesError) throw insertEntriesError;
    }
    
    return { success: true, data: newPlan };
  } catch (error) {
    console.error(`Error creating ${planType} plan from template:`, error);
    return { success: false, error: error.message };
  }
};

// OFFLINE SYNC

// Sync local data with Supabase
export const syncWithSupabase = async (localData, userId) => {
  try {
    // Sync nutrition plans
    if (localData.nutritionPlans) {
      for (const planId in localData.nutritionPlans) {
        const plan = localData.nutritionPlans[planId];
        
        // Check if plan exists in Supabase
        const { data: existingPlan, error: fetchError } = await supabase
          .from('nutrition_plans')
          .select('id')
          .eq('name', plan.name)
          .eq('user_id', userId)
          .maybeSingle();
          
        if (fetchError) throw fetchError;
        
        if (existingPlan) {
          // Update existing plan
          await updateNutritionPlan(existingPlan.id, {
            name: plan.name,
            description: plan.description,
            raceType: plan.raceType,
            raceDuration: plan.raceDuration,
            terrainType: plan.terrainType,
            weatherCondition: plan.weatherCondition,
            intensityLevel: plan.intensityLevel
          });
          
          // Sync entries
          if (plan.entries && plan.entries.length > 0) {
            // Delete existing entries
            await supabase
              .from('nutrition_entries')
              .delete()
              .eq('plan_id', existingPlan.id);
              
            // Add new entries
            for (const entry of plan.entries) {
              await createNutritionEntry(existingPlan.id, {
                foodType: entry.foodType,
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
                isEssential: entry.isEssential,
                sourceLocation: entry.sourceLocation,
                notes: entry.notes
              });
            }
          }
        } else {
          // Create new plan
          const { data: newPlan } = await createNutritionPlan({
            userId,
            name: plan.name,
            description: plan.description,
            raceType: plan.raceType,
            raceDuration: plan.raceDuration,
            terrainType: plan.terrainType,
            weatherCondition: plan.weatherCondition,
            intensityLevel: plan.intensityLevel
          });
          
          // Add entries
          if (plan.entries && plan.entries.length > 0) {
            for (const entry of plan.entries) {
              await createNutritionEntry(newPlan.id, {
                foodType: entry.foodType,
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
                isEssential: entry.isEssential,
                sourceLocation: entry.sourceLocation,
                notes: entry.notes
              });
            }
          }
        }
      }
    }
    
    // Sync hydration plans
    if (localData.hydrationPlans) {
      for (const planId in localData.hydrationPlans) {
        const plan = localData.hydrationPlans[planId];
        
        // Check if plan exists in Supabase
        const { data: existingPlan, error: fetchError } = await supabase
          .from('hydration_plans')
          .select('id')
          .eq('name', plan.name)
          .eq('user_id', userId)
          .maybeSingle();
          
        if (fetchError) throw fetchError;
        
        if (existingPlan) {
          // Update existing plan
          await updateHydrationPlan(existingPlan.id, {
            name: plan.name,
            description: plan.description,
            raceType: plan.raceType,
            raceDuration: plan.raceDuration,
            terrainType: plan.terrainType,
            weatherCondition: plan.weatherCondition,
            intensityLevel: plan.intensityLevel
          });
          
          // Sync entries
          if (plan.entries && plan.entries.length > 0) {
            // Delete existing entries
            await supabase
              .from('hydration_entries')
              .delete()
              .eq('plan_id', existingPlan.id);
              
            // Add new entries
            for (const entry of plan.entries) {
              await createHydrationEntry(existingPlan.id, {
                liquidType: entry.liquidType,
                volume: entry.volume,
                electrolytes: entry.electrolytes,
                timing: entry.timing,
                frequency: entry.frequency,
                consumptionRate: entry.consumptionRate,
                temperature: entry.temperature,
                sourceLocation: entry.sourceLocation,
                containerType: entry.containerType
              });
            }
          }
        } else {
          // Create new plan
          const { data: newPlan } = await createHydrationPlan({
            userId,
            name: plan.name,
            description: plan.description,
            raceType: plan.raceType,
            raceDuration: plan.raceDuration,
            terrainType: plan.terrainType,
            weatherCondition: plan.weatherCondition,
            intensityLevel: plan.intensityLevel
          });
          
          // Add entries
          if (plan.entries && plan.entries.length > 0) {
            for (const entry of plan.entries) {
              await createHydrationEntry(newPlan.id, {
                liquidType: entry.liquidType,
                volume: entry.volume,
                electrolytes: entry.electrolytes,
                timing: entry.timing,
                frequency: entry.frequency,
                consumptionRate: entry.consumptionRate,
                temperature: entry.temperature,
                sourceLocation: entry.sourceLocation,
                containerType: entry.containerType
              });
            }
          }
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error syncing with Supabase:', error);
    return { success: false, error: error.message };
  }
};