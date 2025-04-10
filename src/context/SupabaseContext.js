import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// Create context
const SupabaseContext = createContext();

// Default Supabase URL and anon key (these will be replaced with your actual values)
const SUPABASE_URL = "https://tybnspiyravdizljzrxw.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5Ym5zcGl5cmF2ZGl6bGp6cnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQwNDI4MDksImV4cCI6MjA1OTYxODgwOX0.WrA-XgzKifmw0NZqxkjM2MHCBWSHGWWcsgIawc9dlMQ";

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY);

export const SupabaseProvider = ({ children }) => {
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState(null);

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      try {
        // Create Supabase client
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        });

        setSupabase(supabaseClient);

        // Check for existing session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          setUser(session.user);
          await checkPremiumStatus(supabaseClient, session.user.id);
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              setUser(session.user);
              await checkPremiumStatus(supabaseClient, session.user.id);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setIsPremium(false);
            }
          }
        );

        // Get last backup date
        const storedLastBackupDate = await AsyncStorage.getItem('lastBackupDate');
        if (storedLastBackupDate) {
          setLastBackupDate(new Date(storedLastBackupDate));
        }

        setLoading(false);

        return () => {
          subscription?.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing Supabase:', error);
        setLoading(false);
      }
    };

    initSupabase();
  }, []);

  // Check if user has premium status
  const checkPremiumStatus = async (supabaseClient, userId) => {
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('is_premium')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setIsPremium(data?.is_premium || false);
    } catch (error) {
      console.error('Error checking premium status:', error);
      setIsPremium(false);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, name) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) throw error;
      
      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id, 
              name, 
              email,
              is_premium: false,
              profile_image: null,
              location: '',
              bio: '',
              preferences: {
                distanceUnit: 'miles',
                elevationUnit: 'ft',
                notifications: true,
                darkMode: false
              },
              stats: {
                racesPlanned: 0,
                racesCompleted: 0,
                totalDistance: 0,
                appUsage: 0,
                longestRace: 0
              },
              achievements: [],
              created_at: new Date(),
            },
          ]);

        if (profileError) throw profileError;
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error: error.message };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message };
    }
  };

  // Backup races data to Supabase
  const backupRaces = async (racesData = null) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for backup');
      
      // If no races data is provided, try to get it from AsyncStorage
      let racesArray;
      if (racesData) {
        // Use provided races data
        racesArray = Object.values(racesData);
      } else {
        // Get races data from AsyncStorage
        const storedRaces = await AsyncStorage.getItem('races');
        if (!storedRaces) {
          throw new Error('No races data found in storage');
        }
        const parsedRaces = JSON.parse(storedRaces);
        racesArray = Object.values(parsedRaces);
      }
      
      // Ensure all race preparation data is included
      for (const race of racesArray) {
        // Initialize preparation object if it doesn't exist
        if (!race.preparation) {
          race.preparation = {};
        }
        
        // Ensure gear items are included
        if (!race.preparation.gearItems) {
          race.preparation.gearItems = [];
        }
        
        // Ensure drop bags are included
        if (!race.preparation.dropBags) {
          race.preparation.dropBags = [];
        }
        
        // Ensure nutrition plans are included
        if (!race.preparation.nutritionPlans) {
          race.preparation.nutritionPlans = [];
        }
        
        // Ensure hydration plans are included
        if (!race.preparation.hydrationPlans) {
          race.preparation.hydrationPlans = [];
        }
        
        // Ensure aid stations are included
        if (!race.aidStations) {
          race.aidStations = [];
        }
      }
      
      // First, delete existing backup data for this user
      const { error: deleteError } = await supabase
        .from('race_backups')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) throw deleteError;
      
      // Insert new backup data
      const { error: insertError } = await supabase
        .from('race_backups')
        .insert({
          user_id: user.id,
          races_data: racesArray,
          backup_date: new Date(),
        });
        
      if (insertError) throw insertError;
      
      // Update last backup date
      const now = new Date();
      setLastBackupDate(now);
      await AsyncStorage.setItem('lastBackupDate', now.toISOString());
      
      // If we're using the new schema, also save crew members to the crew_members table
      if (isPremium) {
        try {
          // For each race, save crew members
          for (const race of racesArray) {
            if (race.crewMembers && race.crewMembers.length > 0) {
              // First, get existing crew members for this user
              const { data: existingCrewMembers, error: fetchError } = await supabase
                .from('crew_members')
                .select('id, name, email')
                .eq('user_id', user.id);
                
              if (fetchError) throw fetchError;
              
              // Process each crew member
              for (const crewMember of race.crewMembers) {
                // Check if this crew member already exists in the database
                const existingMember = existingCrewMembers?.find(
                  m => m.email === crewMember.email && crewMember.email
                );
                
                if (existingMember) {
                  // Update existing crew member
                  const { error: updateError } = await supabase
                    .from('crew_members')
                    .update({
                      name: crewMember.name,
                      phone: crewMember.phone,
                      email: crewMember.email,
                      role: crewMember.role,
                      responsibilities: crewMember.responsibilities?.join(', ') || '',
                      notes: crewMember.notes || '',
                      updated_at: new Date()
                    })
                    .eq('id', existingMember.id);
                    
                  if (updateError) throw updateError;
                  
                  // Add to race_crew junction table
                  await supabase
                    .from('race_crew')
                    .upsert({
                      race_id: race.id,
                      crew_member_id: existingMember.id,
                      created_at: new Date()
                    }, { onConflict: ['race_id', 'crew_member_id'] });
                    
                } else {
                  // Insert new crew member
                  const { data: newMember, error: insertMemberError } = await supabase
                    .from('crew_members')
                    .insert({
                      user_id: user.id,
                      name: crewMember.name,
                      phone: crewMember.phone,
                      email: crewMember.email,
                      role: crewMember.role,
                      responsibilities: crewMember.responsibilities?.join(', ') || '',
                      notes: crewMember.notes || '',
                      created_at: new Date(),
                      updated_at: new Date()
                    })
                    .select();
                    
                  if (insertMemberError) throw insertMemberError;
                  
                  if (newMember && newMember.length > 0) {
                    // Add to race_crew junction table
                    await supabase
                      .from('race_crew')
                      .insert({
                        race_id: race.id,
                        crew_member_id: newMember[0].id,
                        created_at: new Date()
                      });
                  }
                }
              }
            }
          }
        } catch (crewError) {
          console.error('Error saving crew members:', crewError);
          // Don't fail the entire backup if crew member saving fails
        }
      }
      
      console.log('Race data backed up successfully with all preparation data');
      return { success: true };
    } catch (error) {
      console.error('Error backing up races:', error);
      return { success: false, error: error.message };
    }
  };

  // Restore races data from Supabase
  const restoreRaces = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for restore');
      
      const { data, error } = await supabase
        .from('race_backups')
        .select('races_data, backup_date')
        .eq('user_id', user.id)
        .order('backup_date', { ascending: false })
        .limit(1)
        .single();
        
      if (error) throw error;
      
      if (!data || !data.races_data) {
        throw new Error('No backup data found');
      }
      
      // Convert races array back to object with id as key
      const racesObject = {};
      data.races_data.forEach(race => {
        // Ensure all race preparation data is included
        if (!race.preparation) {
          race.preparation = {};
        }
        
        // Ensure gear items are included
        if (!race.preparation.gearItems) {
          race.preparation.gearItems = [];
        }
        
        // Ensure drop bags are included
        if (!race.preparation.dropBags) {
          race.preparation.dropBags = [];
        }
        
        // Ensure nutrition plans are included
        if (!race.preparation.nutritionPlans) {
          race.preparation.nutritionPlans = [];
        }
        
        // Ensure hydration plans are included
        if (!race.preparation.hydrationPlans) {
          race.preparation.hydrationPlans = [];
        }
        
        // Ensure aid stations are included
        if (!race.aidStations) {
          race.aidStations = [];
        }
        
        racesObject[race.id] = race;
      });
      
      // If we're using the new schema, also fetch crew members from the crew_members table
      try {
        // Get all crew members for this user
        const { data: crewMembers, error: crewError } = await supabase
          .from('crew_members')
          .select('*')
          .eq('user_id', user.id);
          
        if (crewError) throw crewError;
        
        if (crewMembers && crewMembers.length > 0) {
          // Get race_crew relationships
          const { data: raceCrewRelations, error: relError } = await supabase
            .from('race_crew')
            .select('race_id, crew_member_id')
            .in('crew_member_id', crewMembers.map(cm => cm.id));
            
          if (relError) throw relError;
          
          // For each race, add its crew members
          Object.values(racesObject).forEach(race => {
            // Find crew members for this race
            const crewIdsForRace = raceCrewRelations
              .filter(rel => rel.race_id === race.id)
              .map(rel => rel.crew_member_id);
              
            // Add crew members to race
            if (crewIdsForRace.length > 0) {
              const raceCrewMembers = crewMembers
                .filter(cm => crewIdsForRace.includes(cm.id))
                .map(cm => ({
                  id: cm.id,
                  name: cm.name,
                  phone: cm.phone,
                  email: cm.email,
                  role: cm.role,
                  customRole: '',
                  responsibilities: cm.responsibilities ? cm.responsibilities.split(', ') : [],
                  notes: cm.notes || '',
                  assignedStations: []
                }));
                
              // Add or merge with existing crew members
              if (!race.crewMembers) {
                race.crewMembers = raceCrewMembers;
              } else {
                // Merge with existing crew members
                const existingEmails = race.crewMembers.map(cm => cm.email).filter(Boolean);
                
                // Add new crew members that don't exist in the race yet
                raceCrewMembers.forEach(cm => {
                  if (cm.email && !existingEmails.includes(cm.email)) {
                    race.crewMembers.push(cm);
                  }
                });
              }
            }
          });
        }
      } catch (crewError) {
        console.error('Error fetching crew members:', crewError);
        // Don't fail the entire restore if crew member fetching fails
      }
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('races', JSON.stringify(racesObject));
      
      console.log('Race data restored successfully with all preparation data');
      
      // Force reload the app or refresh races context
      return { 
        success: true, 
        data: racesObject,
        backupDate: new Date(data.backup_date)
      };
    } catch (error) {
      console.error('Error restoring races:', error);
      return { success: false, error: error.message };
    }
  };

  // Upgrade to premium
  const upgradeToPremium = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      
      // Update premium status in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', user.id);
        
      if (error) throw error;
      
      setIsPremium(true);
      return { success: true };
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      return { success: false, error: error.message };
    }
  };

  // Backup gear items to Supabase
  const backupGearItems = async (gearItems) => {
    if (!supabase || !user) {
      return { success: false, error: 'Supabase client not initialized or user not logged in' };
    }

    if (!isPremium) {
      return { success: false, error: 'Premium subscription required for backup' };
    }

    try {
      console.log('Backing up gear items to Supabase...');
      
      // First, delete existing gear items for this user
      const { error: deleteError } = await supabase
        .from('gear_items')
        .delete()
        .eq('user_id', user.id);
        
      if (deleteError) throw deleteError;
      
      // Prepare gear items for insertion
      const gearItemsToInsert = gearItems.map(item => ({
        user_id: user.id,
        name: item.name,
        brand: item.brand || '',
        weight: item.weight || '',
        weight_unit: item.weightUnit || 'g',
        is_nutrition: item.isNutrition || false,
        is_hydration: item.isHydration || false,
        created_at: new Date(),
      }));
      
      // Insert gear items
      const { error: insertError } = await supabase
        .from('gear_items')
        .insert(gearItemsToInsert);
        
      if (insertError) throw insertError;
      
      // Update last backup date
      setLastBackupDate(new Date());
      
      return { success: true };
    } catch (error) {
      console.error('Failed to back up gear items to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Restore gear items from Supabase
  const restoreGearItems = async () => {
    if (!supabase || !user) {
      return { success: false, error: 'Supabase client not initialized or user not logged in' };
    }

    try {
      console.log('Restoring gear items from Supabase...');
      
      // Get gear items from Supabase
      const { data, error } = await supabase
        .from('gear_items')
        .select('*')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { success: true, data: [] };
      }
      
      // Transform data to match app's format
      const gearItems = data.map(item => ({
        name: item.name,
        brand: item.brand,
        weight: item.weight,
        weightUnit: item.weight_unit,
        isNutrition: item.is_nutrition,
        isHydration: item.is_hydration,
      }));
      
      return { success: true, data: gearItems };
    } catch (error) {
      console.error('Failed to restore gear items from Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <SupabaseContext.Provider
      value={{
        supabase,
        user,
        loading,
        isPremium,
        lastBackupDate,
        signIn,
        signUp,
        signOut,
        backupRaces,
        restoreRaces,
        backupGearItems,
        restoreGearItems,
        upgradeToPremium,
      }}
    >
      {children}
    </SupabaseContext.Provider>
  );
};

// Custom hook to use the Supabase context
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};