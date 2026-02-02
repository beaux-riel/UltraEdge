/**
 * UltraEdge App
 * Endurance event planning for Movers
 */

// Polyfills must be imported first
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Theme & Fonts
import { ThemeProvider, useTheme } from './src/theme';
import { useFonts } from './src/hooks/useFonts';

// Data Providers
import { MoverProvider } from './src/context/MoverContext';
import { EventProvider } from './src/context/EventContext';
import { CheckpointProvider } from './src/context/CheckpointContext';
import { GearProvider } from './src/context/GearContext';
import { CrewProvider } from './src/context/CrewContext';
import { DropBagProvider } from './src/context/DropBagContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Loading screen while fonts load
function LoadingScreen() {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.loading, { backgroundColor: theme.colors.parchment }]}>
      <ActivityIndicator size="large" color={theme.colors.forest} />
    </View>
  );
}

// Main app content
function AppContent() {
  const { fontsLoaded, fontError } = useFonts();
  const { isDarkMode } = useTheme();

  // Show loading while fonts load
  if (!fontsLoaded && !fontError) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <AppNavigator />
    </>
  );
}

// Root component with all providers
export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <MoverProvider>
            <EventProvider>
              <CheckpointProvider>
                <GearProvider>
                  <CrewProvider>
                    <DropBagProvider>
                      <AppContent />
                    </DropBagProvider>
                  </CrewProvider>
                </GearProvider>
              </CheckpointProvider>
            </EventProvider>
          </MoverProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
