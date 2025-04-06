import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Create the context
const RaceContext = createContext();

// Sample initial data
const initialRaces = {
  '1': {
    id: '1',
    name: 'Western States 100',
    distance: 100,
    elevation: 18000,
    date: '06/25/2025',
    numAidStations: 25,
    dropBagsAllowed: true,
    crewAllowed: true,
    aidStations: [
      {
        id: '0',
        name: 'Olympic Valley',
        distance: '0',
        cutoffTime: '05:00',
        supplies: {
          water: true,
          sports_drink: true,
          soda: true,
          fruit: true,
          sandwiches: false,
          soup: false,
          medical: true,
        },
        dropBagAllowed: true,
        crewAllowed: true,
      },
      {
        id: '1',
        name: 'Lyon Ridge',
        distance: '10.3',
        cutoffTime: '07:00',
        supplies: {
          water: true,
          sports_drink: true,
          soda: false,
          fruit: true,
          sandwiches: false,
          soup: false,
          medical: true,
        },
        dropBagAllowed: false,
        crewAllowed: false,
      },
      {
        id: '2',
        name: 'Red Star Ridge',
        distance: '15.8',
        cutoffTime: '09:05',
        supplies: {
          water: true,
          sports_drink: true,
          soda: true,
          fruit: true,
          sandwiches: true,
          soup: false,
          medical: true,
        },
        dropBagAllowed: false,
        crewAllowed: false,
      },
    ],
  },
  '2': {
    id: '2',
    name: 'UTMB',
    distance: 171,
    elevation: 10000,
    date: '08/30/2025',
    numAidStations: 10,
    dropBagsAllowed: true,
    crewAllowed: true,
    aidStations: [],
  },
};

// Provider component
export const RaceProvider = ({ children }) => {
  const [races, setRaces] = useState({});
  const [loading, setLoading] = useState(true);

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
          const racesToSave = JSON.stringify(races);
          await AsyncStorage.setItem('races', racesToSave);
          console.log('Races saved successfully');
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

  // Add a new race
  const addRace = (raceData) => {
    setRaces(prevRaces => ({
      ...prevRaces,
      [raceData.id]: raceData
    }));
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
  };

  // Delete a race
  const deleteRace = (raceId) => {
    setRaces(prevRaces => {
      const newRaces = { ...prevRaces };
      delete newRaces[raceId];
      return newRaces;
    });
  };

  // Get all races as an array
  const getRacesArray = () => {
    return Object.values(races);
  };

  // Get a specific race by ID
  const getRaceById = (raceId) => {
    return races[raceId];
  };

  return (
    <RaceContext.Provider value={{
      races,
      loading,
      addRace,
      updateRace,
      deleteRace,
      getRacesArray,
      getRaceById
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