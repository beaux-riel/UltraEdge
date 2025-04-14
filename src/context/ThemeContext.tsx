import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define custom theme colors
const lightThemeColors = {
  ...MD3LightTheme.colors,
  primary: "#2e7d32", // Green 800
  primaryContainer: "#c8e6c9", // Green 100
  secondary: "#1565c0", // Blue 800
  secondaryContainer: "#bbdefb", // Blue 100
  tertiary: "#6a1b9a", // Purple 800
  tertiaryContainer: "#e1bee7", // Purple 100
  error: "#c62828", // Red 800
  errorContainer: "#ffcdd2", // Red 100
  background: "#ffffff",
  surface: "#ffffff",
  surfaceVariant: "#f5f5f5",
  onPrimary: "#ffffff",
  onSecondary: "#ffffff",
  onTertiary: "#ffffff",
  onError: "#ffffff",
  onBackground: "#000000",
  onSurface: "#000000",
  onSurfaceVariant: "#000000",
  text: "#000000",
  elevation: {
    level0: "transparent",
    level1: "#f5f5f5",
    level2: "#eeeeee",
    level3: "#e0e0e0",
    level4: "#d6d6d6",
    level5: "#c2c2c2",
  },
  // Additional custom colors
  success: "#388e3c",
  warning: "#f57c00",
  info: "#0288d1",
  blue: "#2196f3",
  purple: "#9c27b0",
  orange: "#ff9800",
};

const darkThemeColors = {
  ...MD3DarkTheme.colors,
  primary: "#81c784", // Green 300
  primaryContainer: "#1b5e20", // Green 900
  secondary: "#64b5f6", // Blue 300
  secondaryContainer: "#0d47a1", // Blue 900
  tertiary: "#ba68c8", // Purple 300
  tertiaryContainer: "#4a148c", // Purple 900
  error: "#ef5350", // Red 400
  errorContainer: "#b71c1c", // Red 900
  background: "#121212",
  surface: "#121212",
  surfaceVariant: "#1e1e1e",
  onPrimary: "#000000",
  onSecondary: "#000000",
  onTertiary: "#000000",
  onError: "#000000",
  onBackground: "#ffffff",
  onSurface: "#ffffff",
  onSurfaceVariant: "#ffffff",
  text: "#ffffff",
  elevation: {
    level0: "transparent",
    level1: "#1e1e1e",
    level2: "#222222",
    level3: "#272727",
    level4: "#2c2c2c",
    level5: "#2d2d2d",
  },
  // Additional custom colors
  success: "#66bb6a",
  warning: "#ffa726",
  info: "#29b6f6",
  blue: "#42a5f5",
  purple: "#ab47bc",
  orange: "#ffa726",
};

// Create custom themes
const lightTheme = {
  ...MD3LightTheme,
  colors: lightThemeColors,
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: darkThemeColors,
};

// Define theme context types
interface ThemeContextType {
  theme: typeof lightTheme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  themeMode: 'light' | 'dark' | 'system';
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');

  // Load theme preference from storage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedThemeMode = await AsyncStorage.getItem('themeMode');
        if (savedThemeMode) {
          setThemeMode(savedThemeMode as 'light' | 'dark' | 'system');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  // Update dark mode based on theme mode and system preference
  useEffect(() => {
    if (themeMode === 'system') {
      setIsDarkMode(colorScheme === 'dark');
    } else {
      setIsDarkMode(themeMode === 'dark');
    }
  }, [themeMode, colorScheme]);

  // Save theme preference
  const saveThemePreference = async (mode: 'light' | 'dark' | 'system') => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Toggle between light and dark themes
  const toggleTheme = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
    saveThemePreference(newMode);
  };

  // Set specific theme mode
  const handleSetThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    saveThemePreference(mode);
  };

  // Get the current theme
  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        toggleTheme,
        setThemeMode: handleSetThemeMode,
        themeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};