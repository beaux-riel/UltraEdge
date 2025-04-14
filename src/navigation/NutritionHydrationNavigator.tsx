import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../context/ThemeContext';

// Import screens
import PlanOverviewScreen from '../screens/nutrition/PlanOverviewScreen';
import PlanAnalyticsScreen from '../screens/analytics/PlanAnalyticsScreen';
import HydrationPlanScreen from '../screens/hydration/HydrationPlanScreen';
import NutritionPlanScreen from '../screens/nutrition/NutritionPlanScreen';

// Define navigation types
export type NutritionHydrationStackParamList = {
  PlanOverview: undefined;
  NutritionPlan: { planId?: string; editMode?: boolean };
  HydrationPlan: { planId?: string; editMode?: boolean };
  PlanAnalytics: { planId: string; planType: 'nutrition' | 'hydration' };
};

// Create stack navigator
const Stack = createNativeStackNavigator<NutritionHydrationStackParamList>();

// Nutrition and Hydration Navigator
const NutritionHydrationNavigator = () => {
  const { theme, isDarkMode } = useAppTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#ffffff',
        },
        headerTintColor: isDarkMode ? '#ffffff' : '#000000',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="PlanOverview"
        component={PlanOverviewScreen}
        options={{ title: 'Nutrition & Hydration Plans' }}
      />
      <Stack.Screen
        name="NutritionPlan"
        component={NutritionPlanScreen}
        options={{ title: 'Nutrition Plan' }}
      />
      <Stack.Screen
        name="HydrationPlan"
        component={HydrationPlanScreen}
        options={{ title: 'Hydration Plan' }}
      />
      <Stack.Screen
        name="PlanAnalytics"
        component={PlanAnalyticsScreen}
        options={{ title: 'Plan Analytics' }}
      />
    </Stack.Navigator>
  );
};

export default NutritionHydrationNavigator;
