import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import {
  View,
  Text,
  ActivityIndicator,
  useColorScheme,
  Button,
} from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import { RaceProvider } from "./src/context/RaceContext";
import { ThemeProvider, useAppTheme } from "./src/context/ThemeContext";
import { SupabaseProvider } from "./src/context/SupabaseContext";
import { UserProvider } from "./src/context/UserContext";
import { RevenueCatProvider } from "./src/context/RevenueCatContext";
import { SettingsProvider } from "./src/context/SettingsContext";
import { GearProvider } from "./src/context/GearContext";
import { NutritionHydrationProvider } from "./src/context/NutritionHydrationContext";
import { NotesProvider } from "./src/context/NotesContext";

const AppContent = () => {
  const { theme, isDarkMode } = useAppTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDarkMode ? "#121212" : "#f5f5f5",
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: isDarkMode ? "#ffffff" : "#000000",
          }}
        >
          Loading UltraEdge...
        </Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <AppNavigator />
    </>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PaperProviderWithTheme />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Use a separate component to access the theme context
const PaperProviderWithTheme = () => {
  const { theme } = useAppTheme();

  return (
    <PaperProvider theme={theme}>
      <SettingsProvider>
        <NutritionHydrationProvider>
          <SupabaseProvider>
            <RevenueCatProvider>
              <UserProvider>
                <RaceProvider>
                  <GearProvider>
                    <NotesProvider>
                      <AppContent />
                    </NotesProvider>
                  </GearProvider>
                </RaceProvider>
              </UserProvider>
            </RevenueCatProvider>
          </SupabaseProvider>
        </NutritionHydrationProvider>
      </SettingsProvider>
    </PaperProvider>
  );
};
