/**
 * UltraEdge Theme Provider
 * Provides theme context with Organic design system
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, ColorScheme, ThemeMode } from './colors';
import { typography } from './typography';
import { spacing, radius, layout, shadows } from './spacing';

// ============================================================================
// THEME TYPE
// ============================================================================

export interface Theme {
  mode: 'light' | 'dark';
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  layout: typeof layout;
  shadows: typeof shadows.light | typeof shadows.dark;
}

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDarkMode: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@ultraedge/theme-mode';

// ============================================================================
// PROVIDER
// ============================================================================

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine actual dark mode based on mode setting
  const isDarkMode = 
    themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');

  // Load saved theme preference
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    }
    loadTheme();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  // Toggle between light and dark (ignores system)
  const toggleTheme = () => {
    setThemeMode(isDarkMode ? 'light' : 'dark');
  };

  // Build theme object
  const theme: Theme = {
    mode: isDarkMode ? 'dark' : 'light',
    colors: isDarkMode ? colors.dark : colors.light,
    typography,
    spacing,
    radius,
    layout,
    shadows: isDarkMode ? shadows.dark : shadows.light,
  };

  // Don't render until theme is loaded (prevents flash)
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDarkMode,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Convenience hook for just the theme object
export function useColors(): ColorScheme {
  const { theme } = useTheme();
  return theme.colors;
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { colors, typography, spacing, radius, layout, shadows };
export type { ColorScheme, ThemeMode };
