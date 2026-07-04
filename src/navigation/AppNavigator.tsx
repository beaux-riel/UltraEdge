/**
 * UltraEdge Navigation
 * Bottom tabs + stack navigation for all CRUD screens
 */

import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';

// ============================================================================
// SCREENS
// ============================================================================

// Home
import HomeScreen from '../screens/HomeScreen';

// Onboarding
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';
import { isOnboardingComplete } from '../lib/onboarding';

// Events (will be created by agent)
import EventsListScreen from '../screens/events/EventsListScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import EditEventScreen from '../screens/events/EditEventScreen';
import SelectGearScreen from '../screens/events/SelectGearScreen';
import SelectCrewScreen from '../screens/events/SelectCrewScreen';

// Gear (will be created by agent)
import GearListScreen from '../screens/gear/GearListScreen';
import CreateGearScreen from '../screens/gear/CreateGearScreen';
import GearDetailScreen from '../screens/gear/GearDetailScreen';
import EditGearScreen from '../screens/gear/EditGearScreen';

// Crew
import CrewListScreen from '../screens/crew/CrewListScreen';
import CreateCrewScreen from '../screens/crew/CreateCrewScreen';
import CrewDetailScreen from '../screens/crew/CrewDetailScreen';
import EditCrewScreen from '../screens/crew/EditCrewScreen';

// Checkpoints (will be created by agent)
import CheckpointsListScreen from '../screens/checkpoints/CheckpointsListScreen';
import CreateCheckpointScreen from '../screens/checkpoints/CreateCheckpointScreen';
import CheckpointDetailScreen from '../screens/checkpoints/CheckpointDetailScreen';
import EditCheckpointScreen from '../screens/checkpoints/EditCheckpointScreen';

// Drop Bags
import {
  DropBagsListScreen,
  CreateDropBagScreen,
  DropBagDetailScreen,
  EditDropBagScreen,
} from '../screens/dropbags';

// Profile (will be created by agent)
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import WeightLogScreen from '../screens/profile/WeightLogScreen';

// Auth
import { SignInScreen, SignUpScreen } from '../screens/auth';

// Settings
import SubscriptionScreen from '../screens/settings/SubscriptionScreen';
import AboutScreen from '../screens/settings/AboutScreen';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type RootStackParamList = {
  // Onboarding (first launch only)
  Onboarding: undefined;

  // Tabs
  Main: undefined;
  
  // Auth (optional - accessible from Profile/Settings)
  SignIn: undefined;
  SignUp: undefined;
  
  // Settings
  Subscription: undefined;
  About: undefined;
  
  // Events
  CreateEvent: undefined;
  EventDetail: { eventId: string };
  EditEvent: { eventId: string };
  SelectGear: { eventId: string };
  SelectCrew: { eventId: string };
  
  // Gear
  CreateGear: undefined;
  GearDetail: { gearId: string };
  EditGear: { gearId: string };
  
  // Crew
  CreateCrew: undefined;
  CrewDetail: { crewId: string };
  EditCrew: { crewId: string };
  
  // Checkpoints (scoped to event)
  Checkpoints: { eventId: string };
  CreateCheckpoint: { eventId: string };
  CheckpointDetail: { eventId: string; checkpointId: string };
  EditCheckpoint: { eventId: string; checkpointId: string };
  
  // Drop Bags
  DropBags: { eventId?: string };
  CreateDropBag: { eventId?: string };
  DropBagDetail: { dropBagId: string };
  EditDropBag: { dropBagId: string };
  
  // Profile
  EditProfile: undefined;
  WeightLog: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Events: undefined;
  Gear: undefined;
  Crew: undefined;
  Profile: undefined;
};

// ============================================================================
// NAVIGATORS
// ============================================================================

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom Tab Navigator
function MainTabs() {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Events':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Gear':
              iconName = focused ? 'bag-handle' : 'bag-handle-outline';
              break;
            case 'Crew':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.forest,
        tabBarInactiveTintColor: colors.mist,
        tabBarStyle: {
          backgroundColor: colors.cream,
          borderTopColor: colors.borderLight,
          paddingTop: 8,
          height: 84,
        },
        tabBarLabelStyle: {
          fontFamily: typography.caption.fontFamily,
          fontSize: 11,
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: colors.parchment,
        },
        headerTintColor: colors.bark,
        headerTitleStyle: {
          fontFamily: typography.h3.fontFamily,
          fontWeight: '600',
        },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Events" 
        component={EventsListScreen as React.ComponentType<object>}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Gear" 
        component={GearListScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Crew" 
        component={CrewListScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// Shared screen options
function useScreenOptions() {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  return {
    headerStyle: {
      backgroundColor: colors.parchment,
    },
    headerTintColor: colors.bark,
    headerTitleStyle: {
      fontFamily: typography.h3.fontFamily,
      fontWeight: '600' as const,
    },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
  };
}

// Root Stack Navigator
export default function AppNavigator() {
  const { theme, isDarkMode } = useTheme();
  const { colors } = theme;
  const screenOptions = useScreenOptions();

  // null = still reading the flag; render a blank screen so onboarding never flashes
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  useEffect(() => {
    isOnboardingComplete().then(setOnboardingComplete);
  }, []);

  // Custom navigation theme
  const navigationTheme = {
    ...(isDarkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.forest,
      background: colors.parchment,
      card: colors.cream,
      text: colors.bark,
      border: colors.border,
      notification: colors.sunrise,
    },
  };

  if (onboardingComplete === null) {
    return <View style={{ flex: 1, backgroundColor: colors.parchment }} />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={screenOptions}
        initialRouteName={onboardingComplete ? 'Main' : 'Onboarding'}
      >
        {/* Onboarding (first launch only) */}
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false, gestureEnabled: false }}
        />

        {/* Main Tabs */}
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />

        {/* Event Screens */}
        <Stack.Screen
          name="CreateEvent"
          component={CreateEventScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EventDetail"
          component={EventDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditEvent"
          component={EditEventScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SelectGear"
          component={SelectGearScreen}
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="SelectCrew"
          component={SelectCrewScreen}
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }}
        />
        
        {/* Gear Screens */}
        <Stack.Screen
          name="CreateGear"
          component={CreateGearScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GearDetail"
          component={GearDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditGear"
          component={EditGearScreen}
          options={{ headerShown: false }}
        />
        
        {/* Crew Screens */}
        <Stack.Screen
          name="CreateCrew"
          component={CreateCrewScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CrewDetail"
          component={CrewDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditCrew"
          component={EditCrewScreen}
          options={{ headerShown: false }}
        />
        
        {/* Checkpoint Screens */}
        <Stack.Screen
          name="Checkpoints"
          component={CheckpointsListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateCheckpoint"
          component={CreateCheckpointScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CheckpointDetail"
          component={CheckpointDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="EditCheckpoint"
          component={EditCheckpointScreen}
          options={{ headerShown: false }}
        />
        
        {/* Drop Bag Screens */}
        <Stack.Screen
          name="DropBags"
          component={DropBagsListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateDropBag"
          component={CreateDropBagScreen}
          options={{ title: 'New Drop Bag' }}
        />
        <Stack.Screen
          name="DropBagDetail"
          component={DropBagDetailScreen}
          options={{ title: 'Drop Bag' }}
        />
        <Stack.Screen
          name="EditDropBag"
          component={EditDropBagScreen}
          options={{ title: 'Edit Drop Bag' }}
        />
        
        {/* Profile Screens */}
        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WeightLog"
          component={WeightLogScreen}
          options={{ headerShown: false }}
        />
        
        {/* Auth Screens (optional - accessible from Profile) */}
        <Stack.Screen
          name="SignIn"
          component={SignInScreen}
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }}
        />
        
        {/* Settings Screens */}
        <Stack.Screen
          name="Subscription"
          component={SubscriptionScreen}
          options={{ title: 'Subscription' }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ title: 'About UltraEdge' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
