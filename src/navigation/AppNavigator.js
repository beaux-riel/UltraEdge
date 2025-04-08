import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../context/ThemeContext';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import CreateRaceScreen from '../screens/CreateRaceScreen';
import AidStationSetupScreen from '../screens/AidStationSetupScreen';
import RaceDetailsScreen from '../screens/RaceDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import EditAidStationScreen from '../screens/EditAidStationScreen';
import CrewManagementScreen from '../screens/CrewManagementScreen';
import EditProfileScreen from '../screens/EditProfileScreen';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const MainTabNavigator = () => {
  const { isDarkMode, theme } = useAppTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: isDarkMode ? '#9e9e9e' : 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
          borderTopColor: isDarkMode ? '#333333' : '#e0e0e0',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {/* We'll add more tabs later */}
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ tabBarLabel: 'Profile' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
};

// Placeholder screen for tabs we haven't implemented yet
const PlaceholderScreen = () => {
  return null;
};

// Main app navigator
const AppNavigator = () => {
  const { isDarkMode, theme } = useAppTheme();
  
  // Create a custom navigation theme based on dark mode
  const navigationTheme = {
    ...(isDarkMode ? NavigationDarkTheme : DefaultTheme),
    colors: {
      ...(isDarkMode ? NavigationDarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: isDarkMode ? '#1e1e1e' : '#ffffff',
      text: isDarkMode ? '#ffffff' : '#000000',
      border: isDarkMode ? '#333333' : '#e0e0e0',
    },
  };
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={MainTabNavigator} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CreateRace" 
          component={CreateRaceScreen} 
          options={{ title: 'Create Race Plan' }}
        />
        <Stack.Screen 
          name="AidStationSetup" 
          component={AidStationSetupScreen} 
          options={{ title: 'Aid Station Setup' }}
        />
        <Stack.Screen 
          name="RaceDetails" 
          component={RaceDetailsScreen} 
          options={{ title: 'Race Details' }}
        />
        <Stack.Screen 
          name="About" 
          component={AboutScreen} 
          options={{ title: 'About Us' }}
        />
        <Stack.Screen 
          name="EditAidStation" 
          component={EditAidStationScreen} 
          options={{ title: 'Edit Aid Station' }}
        />
        <Stack.Screen 
          name="CrewManagement" 
          component={CrewManagementScreen} 
          options={{ title: 'Crew Management' }}
        />
        <Stack.Screen 
          name="EditProfile" 
          component={EditProfileScreen} 
          options={{ title: 'Edit Profile' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;