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
        racesObject[race.id] = race;
      });
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('races', JSON.stringify(racesObject));
      
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