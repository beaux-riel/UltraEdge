import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import CreateRaceScreen from '../screens/CreateRaceScreen';
import AidStationSetupScreen from '../screens/AidStationSetupScreen';
import RaceDetailsScreen from '../screens/RaceDetailsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const MainTabNavigator = () => {
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
        tabBarActiveTintColor: '#3f51b5',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
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
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#3f51b5',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;