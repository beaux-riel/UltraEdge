import React from "react";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme as NavigationDarkTheme,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../context/ThemeContext";

// Import screens
import HomeScreen from "../screens/HomeScreen";
import CreateRaceScreen from "../screens/CreateRaceScreen";
import ProfileScreen from "../screens/ProfileScreen";
import NutritionHydrationNavigator from "./NutritionHydrationNavigator";
import RaceIntegrationScreen from "../screens/sharing/RaceIntegrationScreen";
import AidStationSetupScreen from "../screens/AidStationSetupScreen";
import RaceDetailsScreen from "../screens/RaceDetailsScreen";
import SettingsScreen from "../screens/SettingsScreen";
import AboutScreen from "../screens/AboutScreen";
import EditAidStationScreen from "../screens/EditAidStationScreen";
import CrewManagementScreen from "../screens/CrewManagementScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import PremiumScreen from "../screens/PremiumScreen";
import RacePrepScreen from "../screens/RacePrepScreen";
import PlanOverviewScreen from "../screens/nutrition/PlanOverviewScreen";

// Define navigation types
export type RootStackParamList = {
  Main: undefined;
  NutritionHydration: NavigatorScreenParams<NutritionHydrationStackParamList>;
  RaceIntegration: { raceId?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Gear: undefined;
  AidStationSetupScreen: undefined;
  Plans: undefined;
  Profile: undefined;
  Settings: undefined;
};

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main tab navigator
const MainTabNavigator = () => {
  const { theme, isDarkMode } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home";

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "Gear") {
            iconName = focused ? "shirt" : "shirt-outline";
          } else if (route.name === "Plans") {
            iconName = focused ? "list" : "list-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Settings") {
            iconName = focused ? "cog" : "cog-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          backgroundColor: isDarkMode ? "#121212" : "#ffffff",
          borderTopColor: isDarkMode ? "#333333" : "#e0e0e0",
        },
        headerStyle: {
          backgroundColor: isDarkMode ? "#121212" : "#ffffff",
        },
        headerTintColor: isDarkMode ? "#ffffff" : "#000000",
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Home" }}
      />
      <Tab.Screen
        name="Gear"
        component={RacePrepScreen}
        options={{ title: "Gear" }}
      />
      <Tab.Screen
        name="Plans"
        component={PlanOverviewScreen}
        options={{ title: "Plans" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};

// Root navigator
const AppNavigator = () => {
  const { theme, isDarkMode } = useAppTheme();

  // Create custom navigation theme
  const navigationTheme = {
    ...(isDarkMode ? NavigationDarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? NavigationDarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: isDarkMode ? "#121212" : "#ffffff",
      card: isDarkMode ? "#1e1e1e" : "#ffffff",
      text: isDarkMode ? "#ffffff" : "#000000",
      border: isDarkMode ? "#333333" : "#e0e0e0",
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: isDarkMode ? "#121212" : "#ffffff",
          },
          headerTintColor: isDarkMode ? "#ffffff" : "#000000",
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AidStationSetup"
          component={AidStationSetupScreen}
          options={{ title: "Aid Station Setup" }}
        />
        <Stack.Screen
          name="RaceDetails"
          component={RaceDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ title: "About Us" }}
        />
        <Stack.Screen
          name="EditAidStation"
          component={EditAidStationScreen}
          options={{ title: "Edit Aid Station" }}
        />
        <Stack.Screen
          name="CrewManagement"
          component={CrewManagementScreen}
          options={{ title: "Crew Management" }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ title: "Edit Profile" }}
        />
        <Stack.Screen
          name="Premium"
          component={PremiumScreen}
          options={{ title: "Premium Subscription" }}
        />
        <Stack.Screen
          name="RacePrep"
          component={RacePrepScreen}
          options={{ title: "Race Preparation" }}
        />
        <Stack.Screen
          name="CreateRace"
          component={CreateRaceScreen}
          options={{ title: "Create Event" }}
        />
        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{ title: "Profile" }}
        />
        <Stack.Screen
          name="NutritionHydration"
          component={NutritionHydrationNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RaceIntegration"
          component={RaceIntegrationScreen}
          options={{ title: "Race Integration & Sharing" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
