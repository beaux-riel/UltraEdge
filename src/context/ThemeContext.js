import React, { createContext, useState, useContext, useEffect } from 'react';
import { DefaultTheme, DarkTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create custom light theme
const LightTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme?.colors,
    primary: '#4361ee',
    accent: '#f72585',
    secondary: '#3a86ff',
    tertiary: '#4cc9f0',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceVariant: '#f5f7fa',
    text: '#333333',
    textSecondary: '#666666',
    textTertiary: '#757575',
    onSurface: '#333333',
    disabled: '#9e9e9e',
    placeholder: '#757575',
    backdrop: 'rgba(0, 0, 0, 0.3)',
    notification: '#f72585',
    card: '#ffffff',
    border: '#e0e0e0',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(247, 243, 249)',
      level2: 'rgb(243, 237, 246)',
      level3: 'rgb(238, 232, 244)',
      level4: 'rgb(236, 230, 243)',
      level5: 'rgb(233, 226, 240)',
    },
  },
};

// Create custom dark theme
const CustomDarkTheme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme?.colors,
    primary: '#4361ee',
    accent: '#f72585',
    secondary: '#3a86ff',
    tertiary: '#4cc9f0',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    background: '#121212',
    surface: '#1e1e1e',
    surfaceVariant: '#252525',
    text: '#ffffff',
    textSecondary: '#e0e0e0',
    textTertiary: '#9e9e9e',
    onSurface: '#ffffff',
    disabled: '#757575',
    placeholder: '#9e9e9e',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f72585',
    card: '#1e1e1e',
    border: '#333333',
    elevation: {
      level0: 'transparent',
      level1: 'rgb(37, 35, 42)',
      level2: 'rgb(44, 40, 49)',
      level3: 'rgb(49, 44, 56)',
      level4: 'rgb(51, 46, 58)',
      level5: 'rgb(52, 47, 60)',
    },
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
export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};