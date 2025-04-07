import React, { createContext, useState, useContext, useEffect } from 'react';
import { DefaultTheme, DarkTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create custom light theme
const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3f51b5',
    accent: '#f50057',
    background: '#f5f5f5',
  },
};

// Create custom dark theme
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#5c6bc0',
    accent: '#ff4081',
    background: '#121212',
    surface: '#1e1e1e',
    text: '#ffffff',
    disabled: '#757575',
    placeholder: '#9e9e9e',
  },
};

// Create the context
const ThemeContext = createContext();

// Provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(LightTheme);

  // Load theme preference from AsyncStorage on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedThemePreference = await AsyncStorage.getItem('isDarkMode');
        if (storedThemePreference !== null) {
          const parsedPreference = JSON.parse(storedThemePreference);
          setIsDarkMode(parsedPreference);
          setTheme(parsedPreference ? CustomDarkTheme : LightTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference from storage', error);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference to AsyncStorage whenever it changes
  useEffect(() => {
    const saveThemePreference = async () => {
      try {
        await AsyncStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
      } catch (error) {
        console.error('Failed to save theme preference to storage', error);
      }
    };

    saveThemePreference();
  }, [isDarkMode]);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    setTheme(!isDarkMode ? CustomDarkTheme : LightTheme);
  };

  return (
    <ThemeContext.Provider value={{
      isDarkMode,
      theme,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};