import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupabase } from './SupabaseContext';

// Create the context
const UserContext = createContext();

// Initial user data
const initialUserData = {
  name: "Alex Runner",
  email: "alex.runner@example.com",
  profileImage: null, // We'll use a placeholder
  location: "Boulder, CO",
  bio: "Ultra runner passionate about mountain trails and pushing limits. Completed 10+ ultras including Western States and UTMB.",
  stats: {
    racesPlanned: 0,
    racesCompleted: 3,
    totalDistance: 0,
    appUsage: 15, // Number of times app used for planning
    longestRace: 0,
  },
  achievements: [
    {
      id: "1",
      name: "First Race Plan",
      icon: "flag-outline",
      date: "2024-03-15",
    },
    {
      id: "2",
      name: "Mountain Master",
      icon: "pyramid",
      date: "2024-04-01",
    },
    {
      id: "3",
      name: "Nutrition Expert",
      icon: "food-apple",
      date: "2024-04-10",
    },
  ],
  preferences: {
    distanceUnit: "miles",
    elevationUnit: "ft",
    notifications: true,
    darkMode: false,
  },
  upcomingRace: null,
};

// Provider component
export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(initialUserData);
  const [loading, setLoading] = useState(true);
  const { user, isPremium, supabase } = useSupabase();

  // Load user data from AsyncStorage on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Always set initial data first to ensure the app has something to display
        setUserData(initialUserData);
        
        // Then try to load from AsyncStorage
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          try {
            const parsedUserData = JSON.parse(storedUserData);
            if (parsedUserData && typeof parsedUserData === 'object') {
              setUserData(parsedUserData);
            }
          } catch (parseError) {
            console.error('Failed to parse user data from storage', parseError);
            // Keep using initialUserData if parsing fails
            await AsyncStorage.setItem('userData', JSON.stringify(initialUserData));
          }
        } else {
          // No stored data, save initial data
          await AsyncStorage.setItem('userData', JSON.stringify(initialUserData));
        }
      } catch (error) {
        console.error('Failed to load user data from storage', error);
        // We already set initialUserData above, so no need to do it again
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure the component is mounted
    const timer = setTimeout(() => {
      loadUserData();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Save user data to AsyncStorage whenever it changes
  useEffect(() => {
    const saveUserData = async () => {
      if (!loading) {
        try {
          // Save to AsyncStorage
          const userDataToSave = JSON.stringify(userData);
          await AsyncStorage.setItem('userData', userDataToSave);
          console.log('User data saved successfully to AsyncStorage');
          
          // If user is premium, also back up to Supabase
          if (user && isPremium && supabase) {
            console.log('User is premium, backing up user data to Supabase...');
            try {
              // First, check if a profile record exists
              const { data: existingProfile, error: fetchError } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .single();
                
              if (fetchError && fetchError.code !== 'PGRST116') {
                throw fetchError;
              }
              
              // Prepare user data for Supabase (excluding sensitive or redundant info)
              const userDataForBackup = {
                name: userData.name,
                email: userData.email,
                profile_image: userData.profileImage,
                location: userData.location,
                bio: userData.bio,
                preferences: userData.preferences,
                stats: userData.stats,
                achievements: userData.achievements,
                updated_at: new Date()
              };
              
              let result;
              if (existingProfile) {
                // Update existing profile
                result = await supabase
                  .from('profiles')
                  .update(userDataForBackup)
                  .eq('id', user.id);
              } else {
                // Insert new profile
                result = await supabase
                  .from('profiles')
                  .insert([{
                    id: user.id,
                    ...userDataForBackup,
                    is_premium: isPremium,
                    created_at: new Date()
                  }]);
              }
              
              if (result.error) throw result.error;
              console.log('User data backed up to Supabase successfully');
            } catch (backupError) {
              console.error('Failed to back up user data to Supabase:', backupError);
            }
          }
        } catch (error) {
          console.error('Failed to save user data to storage', error);
        }
      }
    };

    // Small delay to avoid potential race conditions
    const timer = setTimeout(() => {
      saveUserData();
    }, 100);

    return () => clearTimeout(timer);
  }, [userData, loading, user, isPremium, supabase]);

  // Update user data
  const updateUserData = (updatedData) => {
    setUserData(prevData => ({
      ...prevData,
      ...updatedData
    }));
  };

  // Update user stats
  const updateUserStats = (statsData) => {
    setUserData(prevData => ({
      ...prevData,
      stats: {
        ...prevData.stats,
        ...statsData
      }
    }));
  };

  // Add an achievement
  const addAchievement = (achievement) => {
    setUserData(prevData => ({
      ...prevData,
      achievements: [...prevData.achievements, achievement]
    }));
  };

  // Update preferences
  const updatePreferences = (preferencesData) => {
    setUserData(prevData => ({
      ...prevData,
      preferences: {
        ...prevData.preferences,
        ...preferencesData
      }
    }));
  };

  return (
    <UserContext.Provider value={{
      userData,
      loading,
      updateUserData,
      updateUserStats,
      addAchievement,
      updatePreferences
    }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};