import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { RaceProvider } from './src/context/RaceContext';

// Define our custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3f51b5',
    accent: '#f50057',
    background: '#f5f5f5',
  },
};

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text style={{ marginTop: 16, fontSize: 16 }}>Loading Ultra Endurance Planner...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <RaceProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </RaceProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
