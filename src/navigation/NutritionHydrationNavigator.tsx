import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppTheme } from '../context/ThemeContext';

// Import screens
import PlanOverviewScreen from '../screens/nutrition/PlanOverviewScreen';

// Define navigation types
export type NutritionHydrationStackParamList = {
  PlanOverview: undefined;
  NutritionPlan: { planId: string; editMode?: boolean };
  HydrationPlan: { planId: string; editMode?: boolean };
  CreateNutritionPlan: undefined;
  CreateHydrationPlan: undefined;
  AddNutritionEntry: { planId: string; addingEntry?: boolean };
  EditNutritionEntry: { planId: string; entryId: string; editingEntry?: boolean };
  AddHydrationEntry: { planId: string; addingEntry?: boolean };
  EditHydrationEntry: { planId: string; entryId: string; editingEntry?: boolean };
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
    </Stack.Navigator>
  );
};

export default NutritionHydrationNavigator;