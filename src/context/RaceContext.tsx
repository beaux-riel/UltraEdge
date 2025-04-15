import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useSupabase } from './SupabaseContext';

// Create the context
const RaceContext = createContext();

// Sample initial data
const initialRaces = {};


// Provider component
export const RaceProvider = ({ children }) => {
  const [races, setRaces] = useState({});
  const [loading, setLoading] = useState(true);
  const { user, isPremium, backupRaces, checkAndFetchData } = useSupabase();

  // Load races from AsyncStorage on mount
  useEffect(() => {
    const loadRaces = async () => {
      try {
        // Always set initial data first to ensure the app has something to display
        setRaces(initialRaces);
        
        // Then try to load from AsyncStorage
        const storedRaces = await AsyncStorage.getItem('races');
        if (storedRaces) {
          try {
            const parsedRaces = JSON.parse(storedRaces);
            if (parsedRaces && typeof parsedRaces === 'object') {
              setRaces(parsedRaces);
            }
          } catch (parseError) {
            console.error('Failed to parse races from storage', parseError);
            // Keep using initialRaces if parsing fails
            await AsyncStorage.setItem('races', JSON.stringify(initialRaces));
          }
        } else {
          // No stored data, save initial data
          await AsyncStorage.setItem('races', JSON.stringify(initialRaces));
        }
      } catch (error) {
        console.error('Failed to load races from storage', error);
        // We already set initialRaces above, so no need to do it again
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure the component is mounted
    const timer = setTimeout(() => {
      loadRaces();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Save races to AsyncStorage whenever they change
  useEffect(() => {
    const saveRaces = async () => {
      if (!loading && Object.keys(races).length > 0) {
        try {
          // Save to AsyncStorage
          const racesToSave = JSON.stringify(races);
          await AsyncStorage.setItem('races', racesToSave);
          console.log('Races saved successfully to AsyncStorage');
          
          // We'll only backup to Supabase on explicit user actions (add/update/delete)
          // rather than on every change to prevent excessive uploads
        } catch (error) {
          console.error('Failed to save races to storage', error);
        }
      }
    };

    // Small delay to avoid potential race conditions
    const timer = setTimeout(() => {
      saveRaces();
    }, 100);

    return () => clearTimeout(timer);
  }, [races, loading]);
  
  // Function to manually backup races to Supabase
  const backupRacesToSupabase = async () => {
    if (!user || !isPremium) {
      console.log('Cannot backup: User not logged in or not premium');
      return { success: false, error: 'User not logged in or not premium' };
    }
    
    try {
      console.log('Manually backing up races to Supabase...');
      const result = await backupRaces(races);
      if (result.success) {
        console.log('Races backed up to Supabase successfully');
        return { success: true };
      } else {
        console.error('Failed to back up races to Supabase:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Failed to back up races to Supabase:', error);
      return { success: false, error: error.message };
    }
  };
  
  // Check for data on Supabase when component mounts
  useEffect(() => {
    if (user && isPremium) {
      // Check if we need to fetch data from Supabase
      const checkForSupabaseData = async () => {
        try {
          await checkAndFetchData('races');
        } catch (error) {
          console.error('Error checking for Supabase data:', error);
        }
      };
      
      checkForSupabaseData();
    }
  }, [user, isPremium]);

  // Add a new race
  const addRace = (raceData) => {
    setRaces(prevRaces => ({
      ...prevRaces,
      [raceData.id]: raceData
    }));
    
    // Backup to Supabase if user is premium
    if (user && isPremium) {
      // Wait a bit to ensure state is updated
      setTimeout(() => {
        backupRacesToSupabase();
      }, 300);
    }
  };

  // Update an existing race
  const updateRace = (raceId, updatedData) => {
    setRaces(prevRaces => ({
      ...prevRaces,
      [raceId]: {
        ...prevRaces[raceId],
        ...updatedData
      }
    }));
    
    // Backup to Supabase if user is premium
    if (user && isPremium) {
      // Wait a bit to ensure state is updated
      setTimeout(() => {
        backupRacesToSupabase();
      }, 300);
    }
  };

  // Delete a race
  const deleteRace = (raceId) => {
    setRaces(prevRaces => {
      const newRaces = { ...prevRaces };
      delete newRaces[raceId];
      return newRaces;
    });
    
    // Backup to Supabase if user is premium
    if (user && isPremium) {
      // Wait a bit to ensure state is updated
      setTimeout(() => {
        backupRacesToSupabase();
      }, 300);
    }
  };

  // Get all races as an array
  const getRacesArray = () => {
    return Object.values(races);
  };

  // Get a specific race by ID
  const getRaceById = (raceId) => {
    return races[raceId];
  };

  // Update race notes
  const updateRaceNotes = async (raceId, notes) => {
    return new Promise((resolve, reject) => {
      try {
        setRaces(prevRaces => ({
          ...prevRaces,
          [raceId]: {
            ...prevRaces[raceId],
            notes
          }
        }));
        
        // Backup to Supabase if user is premium
        if (user && isPremium) {
          // Wait a bit to ensure state is updated
          setTimeout(() => {
            backupRacesToSupabase();
          }, 300);
        }
        
        resolve(true);
      } catch (error) {
        console.error('Failed to update race notes:', error);
        reject(error);
      }
    });
  };

  return (
    <RaceContext.Provider value={{
      races,
      loading,
      addRace,
      updateRace,
      deleteRace,
      getRacesArray,
      getRaceById,
      backupRacesToSupabase,
      updateRaceNotes
    }}>
      {children}
    </RaceContext.Provider>
  );
};

// Custom hook to use the race context
export const useRaces = () => {
  const context = useContext(RaceContext);
  if (!context) {
    throw new Error('useRaces must be used within a RaceProvider');
  }
  return context;
};