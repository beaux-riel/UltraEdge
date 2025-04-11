import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../context/ThemeContext';

// Import screens
import PlanOverviewScreen from '../screens/nutrition/PlanOverviewScreen';
import NutritionPlanScreen from '../screens/nutrition/NutritionPlanScreen';
import HydrationPlanScreen from '../screens/hydration/HydrationPlanScreen';
import PlanAnalyticsScreen from '../screens/analytics/PlanAnalyticsScreen';

// Create stack navigator
const Stack = createNativeStackNavigator();

/**
 * Navigator for nutrition and hydration plan screens
 */
const NutritionHydrationNavigator = () => {
  const { theme } = useAppTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="PlanOverview"
        component={PlanOverviewScreen}
        options={{ title: 'Nutrition & Hydration Plans' }}
      />
      
      {/* Nutrition Plan Screens */}
      <Stack.Screen
        name="CreateNutritionPlan"
        component={NutritionPlanScreen}
        options={{ title: 'Create Nutrition Plan' }}
      />
      
      <Stack.Screen
        name="NutritionPlanDetail"
        component={NutritionPlanScreen}
        options={{ title: 'Nutrition Plan' }}
      />
      
      <Stack.Screen
        name="EditNutritionPlan"
        component={NutritionPlanScreen}
        options={{ title: 'Edit Nutrition Plan' }}
        initialParams={{ isEditing: true }}
      />
      
      <Stack.Screen
        name="AddNutritionEntry"
        component={NutritionPlanScreen}
        options={{ title: 'Add Nutrition Entry' }}
        initialParams={{ addingEntry: true }}
      />
      
      <Stack.Screen
        name="EditNutritionEntry"
        component={NutritionPlanScreen}
        options={{ title: 'Edit Nutrition Entry' }}
        initialParams={{ editingEntry: true }}
      />
      
      {/* Hydration Plan Screens */}
      <Stack.Screen
        name="CreateHydrationPlan"
        component={HydrationPlanScreen}
        options={{ title: 'Create Hydration Plan' }}
      />
      
      <Stack.Screen
        name="HydrationPlanDetail"
        component={HydrationPlanScreen}
        options={{ title: 'Hydration Plan' }}
      />
      
      <Stack.Screen
        name="EditHydrationPlan"
        component={HydrationPlanScreen}
        options={{ title: 'Edit Hydration Plan' }}
        initialParams={{ isEditing: true }}
      />
      
      <Stack.Screen
        name="AddHydrationEntry"
        component={HydrationPlanScreen}
        options={{ title: 'Add Hydration Entry' }}
        initialParams={{ addingEntry: true }}
      />
      
      <Stack.Screen
        name="EditHydrationEntry"
        component={HydrationPlanScreen}
        options={{ title: 'Edit Hydration Entry' }}
        initialParams={{ editingEntry: true }}
      />
      
      {/* Analytics Screen */}
      <Stack.Screen
        name="PlanAnalytics"
        component={PlanAnalyticsScreen}
        options={{ title: 'Plan Analytics', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default NutritionHydrationNavigator;