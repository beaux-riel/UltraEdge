import React, { createContext, useState, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

// Create context
const SupabaseContext = createContext();

// Simple UUID generator for React Native
const generateUUID = () => {
  // RFC4122 version 4 compliant UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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
  const [dataFetched, setDataFetched] = useState({
    races: false,
    gearItems: false,
    aidStations: false,
    dropBags: false
  });

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
              // Reset data fetched state on sign out
              setDataFetched({
                races: false,
                gearItems: false,
                aidStations: false,
                dropBags: false
              });
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

  // Helper function to get or create a UUID mapping for race IDs
  const getOrCreateUuidMapping = async (raceId) => {
    try {
      // Try to get existing mapping from AsyncStorage
      const mappingKey = `race_uuid_${raceId}`;
      const existingMapping = await AsyncStorage.getItem(mappingKey);
      
      if (existingMapping) {
        return existingMapping;
      }
      
      // If no mapping exists, check if we have a race with the same name in Supabase
      if (supabase && user) {
        try {
          // Get the race details from AsyncStorage
          const storedRaces = await AsyncStorage.getItem('races');
          if (storedRaces) {
            const racesObject = JSON.parse(storedRaces);
            const race = racesObject[raceId];
            
            if (race && race.name) {
              // Look for a race with the same name in Supabase
              const { data: existingRaces, error } = await supabase
                .from('races')
                .select('id, name')
                .eq('user_id', user.id)
                .eq('name', race.name);
                
              if (!error && existingRaces && existingRaces.length > 0) {
                // Use the existing Supabase UUID for this race
                const supabaseUuid = existingRaces[0].id;
                await AsyncStorage.setItem(mappingKey, supabaseUuid);
                console.log(`Found existing race "${race.name}" in Supabase with ID ${supabaseUuid}`);
                return supabaseUuid;
              }
            }
          }
        } catch (lookupError) {
          console.error('Error looking up race in Supabase:', lookupError);
          // Continue with creating a new UUID
        }
      }
      
      // If no mapping exists and no match found in Supabase, create a new UUID
      const newUuid = generateUUID();
      await AsyncStorage.setItem(mappingKey, newUuid);
      return newUuid;
    } catch (error) {
      console.error('Error getting or creating UUID mapping:', error);
      // Fallback to creating a new UUID if there's an error
      return generateUUID();
    }
  };

  // Helper function to convert time object to PostgreSQL interval format
  const formatTimeToInterval = (timeObj) => {
    if (!timeObj || !timeObj.value) return null;
    
    // Convert to PostgreSQL interval format: '10 hours', '45 minutes', etc.
    return `${timeObj.value} ${timeObj.unit}`;
  };
  
  // Helper function to format time string to PostgreSQL time format
  const formatTimeString = (timeStr) => {
    if (!timeStr) return null;
    return timeStr; // Assuming timeStr is already in format like "07:00"
  };

  // Save race data to Supabase (using the new schema)
  const saveRaceToSupabase = async (race) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      console.log(`Saving race ${race.name} to Supabase...`);
      
      // Get UUID mapping for this race ID
      const supabaseRaceId = await getOrCreateUuidMapping(race.id);
      
      // Check if race already exists in Supabase
      const { data: existingRace, error: fetchError } = await supabase
        .from('races')
        .select('id')
        .eq('id', supabaseRaceId)
        .maybeSingle();
        
      if (fetchError) throw fetchError;
      
      // Store the app's race ID in a custom field for reference
      const raceData = {
        id: supabaseRaceId,
        user_id: user.id,
        name: race.name,
        distance: race.distance || 0,
        elevation: race.elevation || 0,
        date: race.date || new Date().toISOString().split('T')[0],
        start_time: formatTimeString(race.startTime),
        gear_pickup_time: race.gearPickupTime ? new Date(race.gearPickupTime) : null,
        briefing_time: race.briefingTime ? new Date(race.briefingTime) : null,
        cutoff_time: formatTimeToInterval(race.cutoffTime),
        goal_time: formatTimeToInterval(race.goalTime),
        hiking_poles_allowed: race.hikingPolesAllowed !== false, // Default to true
        pacer_allowed: race.pacerAllowed || false,
        pacer_start_point: race.pacerStartPoint || '',
        race_status: race.raceStatus || 'planned',
        result_time: formatTimeToInterval(race.resultTime),
        result_notes: race.resultNotes || '',
        course_notes: race.courseNotes || '',
        updated_at: new Date()
      };
      
      // Insert or update race
      if (existingRace) {
        // Update existing race
        const { error: updateError } = await supabase
          .from('races')
          .update(raceData)
          .eq('id', supabaseRaceId);
          
        if (updateError) throw updateError;
      } else {
        // Insert new race
        raceData.created_at = new Date();
        const { error: insertError } = await supabase
          .from('races')
          .insert(raceData);
          
        if (insertError) throw insertError;
      }
      
      // Store the mapping for future reference
      await AsyncStorage.setItem(`race_uuid_${race.id}`, supabaseRaceId);
      
      return { success: true, supabaseRaceId };
    } catch (error) {
      console.error(`Error saving race to Supabase:`, error);
      return { success: false, error: error.message };
    }
  };

  // Save aid station data to Supabase
  const saveAidStationsToSupabase = async (raceId, aidStations) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      console.log(`Saving aid stations for race ${raceId} to Supabase...`);
      
      // Get UUID mapping for this race ID
      const supabaseRaceId = await getOrCreateUuidMapping(raceId);
      
      // First, delete existing aid stations for this race
      const { error: deleteError } = await supabase
        .from('aid_stations')
        .delete()
        .eq('race_id', supabaseRaceId);
        
      if (deleteError) throw deleteError;
      
      if (!aidStations || aidStations.length === 0) {
        return { success: true }; // No aid stations to save
      }
      
      // Prepare aid stations for insertion
      const aidStationsToInsert = await Promise.all(aidStations.map(async station => {
        // Generate a UUID for each aid station
        const stationUuid = generateUUID();
        
        // Store mapping for future reference
        await AsyncStorage.setItem(`aid_station_uuid_${station.id}`, stationUuid);
        
        return {
          id: stationUuid,
          race_id: supabaseRaceId,
          name: station.name || 'Unnamed Aid Station',
          distance: parseFloat(station.distance) || 0,
          cutoff_time: formatTimeString(station.cutoffTime),
          eta_time: formatTimeString(station.etaTime),
          is_eta_manual: station.isEtaManual || false,
          water_available: station.supplies?.water !== false, // Default to true
          sports_drink_available: station.supplies?.sports_drink !== false, // Default to true
          soda_available: station.supplies?.soda || false,
          fruit_available: station.supplies?.fruit !== false, // Default to true
          sandwiches_available: station.supplies?.sandwiches || false,
          soup_available: station.supplies?.soup || false,
          medical_available: station.supplies?.medical !== false, // Default to true
          other_nutrition: station.supplies?.other || '',
          washroom_available: station.supplies?.washroom || false,
          drop_bag_allowed: station.dropBagAllowed || false,
          crew_allowed: station.crewAllowed || false,
          created_at: new Date(),
          updated_at: new Date()
        };
      }));
      
      // Insert aid stations
      const { error: insertError } = await supabase
        .from('aid_stations')
        .insert(aidStationsToInsert);
        
      if (insertError) throw insertError;
      
      return { success: true };
    } catch (error) {
      console.error(`Error saving aid stations to Supabase:`, error);
      return { success: false, error: error.message };
    }
  };

  // Save drop bag data to Supabase
  const saveDropBagsToSupabase = async (raceId, dropBags) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      console.log(`Saving drop bags for race ${raceId} to Supabase...`);
      
      // Get UUID mapping for this race ID
      const supabaseRaceId = await getOrCreateUuidMapping(raceId);
      
      // First, delete existing drop bags for this race
      const { error: deleteError } = await supabase
        .from('race_drop_bags')
        .delete()
        .eq('race_id', supabaseRaceId);
        
      if (deleteError) throw deleteError;
      
      if (!dropBags || dropBags.length === 0) {
        return { success: true }; // No drop bags to save
      }
      
      // Prepare drop bags for insertion
      const dropBagsToInsert = await Promise.all(dropBags.map(async bag => {
        // Generate a UUID for each drop bag
        const bagUuid = generateUUID();
        
        // Store mapping for future reference
        await AsyncStorage.setItem(`drop_bag_uuid_${bag.id}`, bagUuid);
        
        // Get UUID for aid station if it exists
        let aidStationUuid = null;
        if (bag.aidStationId) {
          aidStationUuid = await AsyncStorage.getItem(`aid_station_uuid_${bag.aidStationId}`);
        }
        
        return {
          id: bagUuid,
          race_id: supabaseRaceId,
          aid_station_id: aidStationUuid,
          name: bag.name || `Drop Bag ${bag.id}`,
          items: bag.items || [],
          created_at: new Date(),
          updated_at: new Date()
        };
      }));
      
      // Insert drop bags
      const { error: insertError } = await supabase
        .from('race_drop_bags')
        .insert(dropBagsToInsert);
        
      if (insertError) throw insertError;
      
      return { success: true };
    } catch (error) {
      console.error(`Error saving drop bags to Supabase:`, error);
      return { success: false, error: error.message };
    }
  };

  // Backup races data to Supabase (using both legacy and new schema)
  const backupRaces = async (racesData = null) => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      
      // Always save to AsyncStorage first
      let racesArray;
      let racesObject;
      
      if (racesData) {
        // Use provided races data
        racesObject = racesData;
        racesArray = Object.values(racesData);
      } else {
        // Get races data from AsyncStorage
        const storedRaces = await AsyncStorage.getItem('races');
        if (!storedRaces) {
          throw new Error('No races data found in storage');
        }
        racesObject = JSON.parse(storedRaces);
        racesArray = Object.values(racesObject);
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
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('races', JSON.stringify(racesObject));
      
      // If user is premium, also save to Supabase
      if (isPremium) {
        // Legacy backup to race_backups table
        const { error: deleteError } = await supabase
          .from('race_backups')
          .delete()
          .eq('user_id', user.id);
          
        if (deleteError) throw deleteError;
        
        const { error: insertError } = await supabase
          .from('race_backups')
          .insert({
            user_id: user.id,
            races_data: racesArray,
            backup_date: new Date(),
          });
          
        if (insertError) throw insertError;
        
        // New schema: Save each race to the races table
        for (const race of racesArray) {
          // Save race data
          await saveRaceToSupabase(race);
          
          // Save aid stations
          if (race.aidStations && race.aidStations.length > 0) {
            await saveAidStationsToSupabase(race.id, race.aidStations);
          }
          
          // Save drop bags
          if (race.preparation && race.preparation.dropBags && race.preparation.dropBags.length > 0) {
            await saveDropBagsToSupabase(race.id, race.preparation.dropBags);
          }
          
          // Save crew members
          if (race.crewMembers && race.crewMembers.length > 0) {
            try {
              // Get UUID mapping for this race ID
              const supabaseRaceId = await getOrCreateUuidMapping(race.id);
              
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
                
                let crewMemberId;
                
                if (existingMember) {
                  // Update existing crew member
                  crewMemberId = existingMember.id;
                  
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
                    .eq('id', crewMemberId);
                    
                  if (updateError) throw updateError;
                } else {
                  // Generate a UUID for the new crew member
                  crewMemberId = generateUUID();
                  
                  // Insert new crew member
                  const { error: insertMemberError } = await supabase
                    .from('crew_members')
                    .insert({
                      id: crewMemberId,
                      user_id: user.id,
                      name: crewMember.name,
                      phone: crewMember.phone,
                      email: crewMember.email,
                      role: crewMember.role,
                      responsibilities: crewMember.responsibilities?.join(', ') || '',
                      notes: crewMember.notes || '',
                      created_at: new Date(),
                      updated_at: new Date()
                    });
                    
                  if (insertMemberError) throw insertMemberError;
                  
                  // Store mapping for future reference
                  await AsyncStorage.setItem(`crew_member_uuid_${crewMember.id}`, crewMemberId);
                }
                
                // Add to race_crew junction table
                await supabase
                  .from('race_crew')
                  .upsert({
                    id: generateUUID(), // Generate a UUID for the junction table entry
                    race_id: supabaseRaceId,
                    crew_member_id: crewMemberId,
                    created_at: new Date()
                  }, { onConflict: ['race_id', 'crew_member_id'] });
              }
            } catch (crewError) {
              console.error('Error saving crew members:', crewError);
              // Don't fail the entire backup if crew member saving fails
            }
          }
        }
      }
      
      // Update last backup date
      const now = new Date();
      setLastBackupDate(now);
      await AsyncStorage.setItem('lastBackupDate', now.toISOString());
      
      console.log('Race data backed up successfully with all preparation data');
      return { success: true };
    } catch (error) {
      console.error('Error backing up races:', error);
      return { success: false, error: error.message };
    }
  };

  // Fetch races from Supabase (using the new schema)
  const fetchRacesFromSupabase = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      if (!isPremium) throw new Error('Premium subscription required for Supabase sync');
      
      console.log('Fetching races from Supabase...');
      
      // Get races from Supabase
      const { data: racesData, error: racesError } = await supabase
        .from('races')
        .select('*')
        .eq('user_id', user.id);
        
      if (racesError) throw racesError;
      
      if (!racesData || racesData.length === 0) {
        return { success: true, data: {} };
      }
      
      // Convert to app format
      const racesObject = {};
      
      // Process each race
      for (const race of racesData) {
        // Get aid stations for this race
        const { data: aidStationsData, error: aidStationsError } = await supabase
          .from('aid_stations')
          .select('*')
          .eq('race_id', race.id);
          
        if (aidStationsError) throw aidStationsError;
        
        // Get drop bags for this race
        const { data: dropBagsData, error: dropBagsError } = await supabase
          .from('race_drop_bags')
          .select('*')
          .eq('race_id', race.id);
          
        if (dropBagsError) throw dropBagsError;
        
        // Format aid stations
        const aidStations = aidStationsData ? aidStationsData.map(station => ({
          id: station.id,
          name: station.name,
          distance: station.distance.toString(),
          cutoffTime: station.cutoff_time,
          etaTime: station.eta_time,
          isEtaManual: station.is_eta_manual,
          supplies: {
            water: station.water_available,
            sports_drink: station.sports_drink_available,
            soda: station.soda_available,
            fruit: station.fruit_available,
            sandwiches: station.sandwiches_available,
            soup: station.soup_available,
            medical: station.medical_available,
            other: station.other_nutrition,
            washroom: station.washroom_available
          },
          dropBagAllowed: station.drop_bag_allowed,
          crewAllowed: station.crew_allowed
        })) : [];
        
        // Format drop bags
        const dropBags = dropBagsData ? dropBagsData.map(bag => ({
          id: bag.id,
          name: bag.name,
          aidStationId: bag.aid_station_id,
          items: bag.items
        })) : [];
        
        // Create race object
        racesObject[race.id] = {
          id: race.id,
          name: race.name,
          distance: race.distance,
          elevation: race.elevation,
          date: race.date,
          startTime: race.start_time,
          gearPickupTime: race.gear_pickup_time,
          briefingTime: race.briefing_time,
          cutoffTime: race.cutoff_time,
          goalTime: race.goal_time,
          hikingPolesAllowed: race.hiking_poles_allowed,
          pacerAllowed: race.pacer_allowed,
          pacerStartPoint: race.pacer_start_point,
          status: race.race_status,
          resultTime: race.result_time,
          resultNotes: race.result_notes,
          courseNotes: race.course_notes,
          aidStations: aidStations,
          preparation: {
            dropBags: dropBags,
            gearItems: [],
            nutritionPlans: [],
            hydrationPlans: []
          }
        };
      }
      
      // Get crew members
      try {
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
                
              race.crewMembers = raceCrewMembers;
            } else {
              race.crewMembers = [];
            }
          });
        }
      } catch (crewError) {
        console.error('Error fetching crew members:', crewError);
        // Don't fail the entire fetch if crew member fetching fails
      }
      
      // Mark races as fetched
      setDataFetched(prev => ({ ...prev, races: true }));
      
      return { success: true, data: racesObject };
    } catch (error) {
      console.error('Error fetching races from Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Restore races data from Supabase
  const restoreRaces = async () => {
    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      if (!user) throw new Error('User not authenticated');
      
      // Try to get races from AsyncStorage first
      const storedRaces = await AsyncStorage.getItem('races');
      let racesObject = {};
      
      if (storedRaces) {
        try {
          racesObject = JSON.parse(storedRaces);
        } catch (parseError) {
          console.error('Failed to parse races from storage', parseError);
        }
      }
      
      // If user is premium, also try to fetch from Supabase
      if (isPremium) {
        try {
          // Try to fetch from the new schema first
          const result = await fetchRacesFromSupabase();
          
          if (result.success && result.data && Object.keys(result.data).length > 0) {
            // Get all existing UUID mappings
            const keys = await AsyncStorage.getAllKeys();
            const uuidMappingKeys = keys.filter(key => key.startsWith('race_uuid_'));
            const uuidMappings = {};
            
            // Build a mapping of app race IDs to Supabase UUIDs
            for (const key of uuidMappingKeys) {
              const appRaceId = key.replace('race_uuid_', '');
              const supabaseUuid = await AsyncStorage.getItem(key);
              if (supabaseUuid) {
                uuidMappings[supabaseUuid] = appRaceId;
              }
            }
            
            // Process Supabase races
            const supabaseRaces = result.data;
            const mergedRaces = { ...racesObject };
            
            // For each Supabase race, find its corresponding app race ID
            for (const supabaseUuid in supabaseRaces) {
              const supabaseRace = supabaseRaces[supabaseUuid];
              const appRaceId = uuidMappings[supabaseUuid] || supabaseUuid;
              
              // If we have a local race with this ID, merge them (prefer Supabase data)
              if (racesObject[appRaceId]) {
                // Preserve local data that might not be in Supabase
                const localRace = racesObject[appRaceId];
                
                // Merge preparation data
                if (!supabaseRace.preparation) supabaseRace.preparation = {};
                if (localRace.preparation) {
                  // Merge gear items
                  if (!supabaseRace.preparation.gearItems && localRace.preparation.gearItems) {
                    supabaseRace.preparation.gearItems = localRace.preparation.gearItems;
                  }
                  
                  // Merge nutrition plans
                  if (!supabaseRace.preparation.nutritionPlans && localRace.preparation.nutritionPlans) {
                    supabaseRace.preparation.nutritionPlans = localRace.preparation.nutritionPlans;
                  }
                  
                  // Merge hydration plans
                  if (!supabaseRace.preparation.hydrationPlans && localRace.preparation.hydrationPlans) {
                    supabaseRace.preparation.hydrationPlans = localRace.preparation.hydrationPlans;
                  }
                }
                
                // Store the merged race
                mergedRaces[appRaceId] = supabaseRace;
                
                // Ensure the UUID mapping is stored
                await AsyncStorage.setItem(`race_uuid_${appRaceId}`, supabaseUuid);
              } else {
                // This is a new race from Supabase
                mergedRaces[appRaceId] = supabaseRace;
              }
            }
            
            // Update racesObject with merged data
            racesObject = mergedRaces;
          } else {
            // Fall back to legacy race_backups table
            const { data, error } = await supabase
              .from('race_backups')
              .select('races_data, backup_date')
              .eq('user_id', user.id)
              .order('backup_date', { ascending: false })
              .limit(1)
              .single();
              
            if (error) {
              console.error('Error fetching from race_backups:', error);
            } else if (data && data.races_data) {
              // Convert races array back to object with id as key
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
              
              // Update last backup date
              setLastBackupDate(new Date(data.backup_date));
            }
          }
        } catch (supabaseError) {
          console.error('Error fetching from Supabase:', supabaseError);
          // Continue with local data if Supabase fetch fails
        }
      }
      
      // Save merged data back to AsyncStorage
      await AsyncStorage.setItem('races', JSON.stringify(racesObject));
      
      console.log('Race data restored successfully');
      
      return { 
        success: true, 
        data: racesObject,
        backupDate: lastBackupDate
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

  // Save gear items to AsyncStorage and optionally to Supabase
  const saveGearItems = async (gearItems) => {
    try {
      // Always save to AsyncStorage first
      await AsyncStorage.setItem('gearItems', JSON.stringify(gearItems));
      
      // If user is premium, also save to Supabase
      if (user && isPremium && supabase) {
        await backupGearItems(gearItems);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving gear items:', error);
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
        description: item.description || '',
        weight: item.weight || '',
        weight_unit: item.weightUnit || 'g',
        is_nutrition: item.isNutrition || false,
        is_hydration: item.isHydration || false,
        category: item.category || (item.isNutrition ? 'Nutrition' : (item.isHydration ? 'Hydration' : 'General')),
        quantity: item.quantity || 1,
        retired: item.retired || false,
        created_at: new Date(),
      }));
      
      // Insert gear items
      const { error: insertError } = await supabase
        .from('gear_items')
        .insert(gearItemsToInsert);
        
      if (insertError) throw insertError;
      
      // Update last backup date
      const now = new Date();
      setLastBackupDate(now);
      await AsyncStorage.setItem('lastBackupDate', now.toISOString());
      
      // Mark gear items as fetched
      setDataFetched(prev => ({ ...prev, gearItems: true }));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to back up gear items to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  // Restore gear items from Supabase
  const restoreGearItems = async () => {
    try {
      // Try to get gear items from AsyncStorage first
      const storedGearItems = await AsyncStorage.getItem('gearItems');
      let gearItems = [];
      
      if (storedGearItems) {
        try {
          gearItems = JSON.parse(storedGearItems);
        } catch (parseError) {
          console.error('Failed to parse gear items from storage', parseError);
        }
      }
      
      // If user is premium and logged in, also try to fetch from Supabase
      if (user && isPremium && supabase) {
        try {
          // Get gear items from Supabase
          const { data, error } = await supabase
            .from('gear_items')
            .select('*')
            .eq('user_id', user.id);
            
          if (error) throw error;
          
          if (data && data.length > 0) {
            // Transform data to match app's format
            const supabaseGearItems = data.map(item => ({
              name: item.name,
              brand: item.brand,
              description: item.description,
              weight: item.weight,
              weightUnit: item.weight_unit,
              isNutrition: item.is_nutrition,
              isHydration: item.is_hydration,
              category: item.category || (item.is_nutrition ? 'Nutrition' : (item.is_hydration ? 'Hydration' : 'General')),
              quantity: item.quantity || 1,
              retired: item.retired || false,
            }));
            
            // Use Supabase data as it's more up-to-date
            gearItems = supabaseGearItems;
            
            // Save back to AsyncStorage
            await AsyncStorage.setItem('gearItems', JSON.stringify(gearItems));
          }
          
          // Mark gear items as fetched
          setDataFetched(prev => ({ ...prev, gearItems: true }));
        } catch (supabaseError) {
          console.error('Error fetching gear items from Supabase:', supabaseError);
          // Continue with local data if Supabase fetch fails
        }
      }
      
      return { success: true, data: gearItems };
    } catch (error) {
      console.error('Failed to restore gear items:', error);
      return { success: false, error: error.message };
    }
  };

  // Save aid stations to AsyncStorage and optionally to Supabase
  const saveAidStations = async (raceId, aidStations) => {
    try {
      // Get races from AsyncStorage
      const storedRaces = await AsyncStorage.getItem('races');
      if (!storedRaces) {
        throw new Error('No races found in storage');
      }
      
      const racesObject = JSON.parse(storedRaces);
      if (!racesObject[raceId]) {
        throw new Error(`Race with ID ${raceId} not found`);
      }
      
      // Update aid stations
      racesObject[raceId].aidStations = aidStations;
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('races', JSON.stringify(racesObject));
      
      // If user is premium, also save to Supabase
      if (user && isPremium && supabase) {
        await saveAidStationsToSupabase(raceId, aidStations);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving aid stations:', error);
      return { success: false, error: error.message };
    }
  };

  // Save drop bags to AsyncStorage and optionally to Supabase
  const saveDropBags = async (raceId, dropBags) => {
    try {
      // Get races from AsyncStorage
      const storedRaces = await AsyncStorage.getItem('races');
      if (!storedRaces) {
        throw new Error('No races found in storage');
      }
      
      const racesObject = JSON.parse(storedRaces);
      if (!racesObject[raceId]) {
        throw new Error(`Race with ID ${raceId} not found`);
      }
      
      // Ensure preparation object exists
      if (!racesObject[raceId].preparation) {
        racesObject[raceId].preparation = {};
      }
      
      // Update drop bags
      racesObject[raceId].preparation.dropBags = dropBags;
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem('races', JSON.stringify(racesObject));
      
      // If user is premium, also save to Supabase
      if (user && isPremium && supabase) {
        await saveDropBagsToSupabase(raceId, dropBags);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error saving drop bags:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if data needs to be fetched from Supabase
  const checkAndFetchData = async (dataType) => {
    if (user && isPremium && supabase && !dataFetched[dataType]) {
      switch (dataType) {
        case 'races':
          await restoreRaces();
          break;
        case 'gearItems':
          await restoreGearItems();
          break;
        case 'aidStations':
          // This is handled as part of races
          setDataFetched(prev => ({ ...prev, aidStations: true }));
          break;
        case 'dropBags':
          // This is handled as part of races
          setDataFetched(prev => ({ ...prev, dropBags: true }));
          break;
      }
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
        saveGearItems,
        backupGearItems,
        restoreGearItems,
        saveAidStations,
        saveDropBags,
        checkAndFetchData,
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