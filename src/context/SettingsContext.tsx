import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
const SettingsContext = createContext();

// Default settings
const defaultSettings = {
  distanceUnit: 'miles',  // 'miles' or 'km'
  elevationUnit: 'ft',    // 'ft' or 'm'
  notifications: true,
  autoBackup: true,
  syncWithStrava: false,
};

// Provider component
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load each setting individually
        const storedDistanceUnit = await AsyncStorage.getItem('distanceUnit');
        const storedElevationUnit = await AsyncStorage.getItem('elevationUnit');
        const storedNotifications = await AsyncStorage.getItem('notifications');
        const storedAutoBackup = await AsyncStorage.getItem('autoBackup');
        const storedSyncWithStrava = await AsyncStorage.getItem('syncWithStrava');

        // Update settings with stored values if they exist
        const updatedSettings = { ...defaultSettings };
        
        if (storedDistanceUnit !== null) updatedSettings.distanceUnit = storedDistanceUnit;
        if (storedElevationUnit !== null) updatedSettings.elevationUnit = storedElevationUnit;
        if (storedNotifications !== null) updatedSettings.notifications = JSON.parse(storedNotifications);
        if (storedAutoBackup !== null) updatedSettings.autoBackup = JSON.parse(storedAutoBackup);
        if (storedSyncWithStrava !== null) updatedSettings.syncWithStrava = JSON.parse(storedSyncWithStrava);

        setSettings(updatedSettings);
      } catch (error) {
        console.error('Failed to load settings from storage', error);
        // Keep using default settings if loading fails
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save a setting to AsyncStorage
  const saveSetting = async (key, value) => {
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem(
        key, 
        typeof value === 'string' ? value : JSON.stringify(value)
      );
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        [key]: value
      }));
      
      return true;
    } catch (error) {
      console.error(`Failed to save ${key} to storage`, error);
      return false;
    }
  };

  // Update multiple settings at once
  const updateSettings = async (newSettings) => {
    try {
      // Update each setting in AsyncStorage
      const promises = Object.entries(newSettings).map(([key, value]) => 
        AsyncStorage.setItem(
          key, 
          typeof value === 'string' ? value : JSON.stringify(value)
        )
      );
      
      await Promise.all(promises);
      
      // Update local state
      setSettings(prevSettings => ({
        ...prevSettings,
        ...newSettings
      }));
      
      return true;
    } catch (error) {
      console.error('Failed to update settings', error);
      return false;
    }
  };

  // Reset settings to defaults
  const resetSettings = async () => {
    try {
      // Clear all settings from AsyncStorage
      const keys = Object.keys(defaultSettings);
      await AsyncStorage.multiRemove(keys);
      
      // Reset to defaults
      setSettings(defaultSettings);
      
      return true;
    } catch (error) {
      console.error('Failed to reset settings', error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        saveSetting,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};