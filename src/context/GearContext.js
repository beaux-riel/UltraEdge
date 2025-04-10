import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupabase } from './SupabaseContext';

// Create the context
const GearContext = createContext();

export const GearProvider = ({ children }) => {
  const [gearItems, setGearItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isPremium, supabase, backupGearItems, restoreGearItems } = useSupabase();

  // Load gear items from storage on mount
  useEffect(() => {
    const loadGearItems = async () => {
      try {
        setLoading(true);
        
        // Try to restore from Supabase first if user is premium
        if (user && isPremium) {
          const result = await restoreGearItems();
          if (result.success && result.data) {
            setGearItems(result.data);
            // Also save to AsyncStorage as a backup
            await AsyncStorage.setItem('gearItems', JSON.stringify(result.data));
            setLoading(false);
            return;
          }
        }
        
        // Fall back to AsyncStorage
        const storedGearItems = await AsyncStorage.getItem('gearItems');
        if (storedGearItems) {
          setGearItems(JSON.parse(storedGearItems));
        }
      } catch (error) {
        console.error('Failed to load gear items:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGearItems();
  }, [user, isPremium]);

  // Save gear items to AsyncStorage and optionally to Supabase
  const saveGearItems = async (updatedGearItems) => {
    try {
      setGearItems(updatedGearItems);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('gearItems', JSON.stringify(updatedGearItems));
      
      return { success: true };
    } catch (error) {
      console.error('Failed to save gear items:', error);
      return { success: false, error: error.message };
    }
  };

  // Add a new gear item
  const addGearItem = async (newItem) => {
    // Ensure the new item has quantity and retired properties
    const itemWithDefaults = {
      ...newItem,
      quantity: newItem.quantity || 1,
      retired: newItem.retired || false
    };
    
    const updatedGearItems = [...gearItems, itemWithDefaults];
    
    // If user is premium, push to Supabase immediately
    if (user && isPremium) {
      try {
        await backupGearItems(updatedGearItems);
      } catch (error) {
        console.error('Failed to backup new gear item to Supabase:', error);
      }
    }
    
    return saveGearItems(updatedGearItems);
  };

  // Update an existing gear item
  const updateGearItem = async (index, updatedItem) => {
    // Ensure the updated item has quantity and retired properties
    const itemWithDefaults = {
      ...updatedItem,
      quantity: updatedItem.quantity !== undefined ? updatedItem.quantity : 1,
      retired: updatedItem.retired !== undefined ? updatedItem.retired : false
    };
    
    const updatedGearItems = [...gearItems];
    updatedGearItems[index] = itemWithDefaults;
    
    // If user is premium, push to Supabase immediately
    if (user && isPremium) {
      try {
        await backupGearItems(updatedGearItems);
      } catch (error) {
        console.error('Failed to backup updated gear item to Supabase:', error);
      }
    }
    
    return saveGearItems(updatedGearItems);
  };

  // Delete a gear item
  const deleteGearItem = async (index) => {
    const updatedGearItems = [...gearItems];
    updatedGearItems.splice(index, 1);
    
    // If user is premium, push to Supabase immediately
    if (user && isPremium) {
      try {
        await backupGearItems(updatedGearItems);
      } catch (error) {
        console.error('Failed to backup gear items after deletion to Supabase:', error);
      }
    }
    
    return saveGearItems(updatedGearItems);
  };

  // Manually trigger a backup to Supabase
  const backupGearItemsToSupabase = async () => {
    if (!user || !isPremium) {
      return { success: false, error: 'User not logged in or not premium' };
    }
    
    try {
      const result = await backupGearItems(gearItems);
      return result;
    } catch (error) {
      console.error('Failed to backup gear items to Supabase:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <GearContext.Provider
      value={{
        gearItems,
        loading,
        saveGearItems,
        addGearItem,
        updateGearItem,
        deleteGearItem,
        backupGearItemsToSupabase,
      }}
    >
      {children}
    </GearContext.Provider>
  );
};

// Custom hook to use the gear context
export const useGear = () => {
  const context = useContext(GearContext);
  if (!context) {
    throw new Error('useGear must be used within a GearProvider');
  }
  return context;
};