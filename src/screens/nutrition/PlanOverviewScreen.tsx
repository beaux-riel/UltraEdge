import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Text, Card, Button, FAB, Chip, Searchbar, SegmentedButtons } from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { useNutritionHydration } from '../../context/NutritionHydrationContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionHydrationStackParamList } from '../../navigation/NutritionHydrationNavigator';
import { useNavigation } from '@react-navigation/native';

type PlanOverviewScreenNavigationProp = NativeStackNavigationProp<NutritionHydrationStackParamList>;

const PlanOverviewScreen = () => {
  const { theme, isDarkMode } = useAppTheme();
  const navigation = useNavigation<PlanOverviewScreenNavigationProp>();
  const { nutritionPlans, hydrationPlans, loading } = useNutritionHydration();
  
  const [activeTab, setActiveTab] = useState<'nutrition' | 'hydration'>('nutrition');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get plans based on active tab
  const getPlans = () => {
    const plans = activeTab === 'nutrition' 
      ? Object.values(nutritionPlans)
      : Object.values(hydrationPlans);
      
    // Filter by search query if provided
    if (searchQuery) {
      return plans.filter(plan => 
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plan.description && plan.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return plans;
  };
  
  // Handle plan selection
  const handleSelectPlan = (planId: string) => {
    if (activeTab === 'nutrition') {
      navigation.navigate('NutritionHydration', {
        screen: 'NutritionPlan',
        params: { planId }
      });
    } else {
      navigation.navigate('NutritionHydration', {
        screen: 'HydrationPlan',
        params: { planId }
      });
    }
  };
  
  // Handle create plan
  const handleCreatePlan = () => {
    if (activeTab === 'nutrition') {
      navigation.navigate('NutritionHydration', {
        screen: 'NutritionPlan',
        params: { editMode: true }
      });
    } else {
      navigation.navigate('NutritionHydration', {
        screen: 'HydrationPlan',
        params: { editMode: true }
      });
    }
  };
  
  // Render plan item
  const renderPlanItem = ({ item }: { item: any }) => (
    <Card 
      style={styles.planCard}
      onPress={() => handleSelectPlan(item.id)}
    >
      <Card.Content>
        <Text style={styles.planName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.planDescription}>{item.description}</Text>
        )}
        <View style={styles.planMeta}>
          {item.raceType && (
            <Chip style={styles.chip} compact>
              {item.raceType}
            </Chip>
          )}
          {item.terrainType && (
            <Chip style={styles.chip} compact>
              {item.terrainType}
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }
    ]}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search plans"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <SegmentedButtons
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'nutrition' | 'hydration')}
          buttons={[
            { value: 'nutrition', label: 'Nutrition' },
            { value: 'hydration', label: 'Hydration' }
          ]}
          style={styles.tabButtons}
        />
      </View>
      
      {loading ? (
        <View style={styles.centerContent}>
          <Text>Loading plans...</Text>
        </View>
      ) : getPlans().length === 0 ? (
        <View style={styles.centerContent}>
          <Text>No {activeTab} plans found</Text>
          <Button 
            mode="contained" 
            onPress={handleCreatePlan}
            style={styles.createButton}
          >
            Create {activeTab === 'nutrition' ? 'Nutrition' : 'Hydration'} Plan
          </Button>
        </View>
      ) : (
        <FlatList
          data={getPlans()}
          renderItem={renderPlanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        onPress={handleCreatePlan}
        color="#ffffff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  tabButtons: {
    marginBottom: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  createButton: {
    marginTop: 16,
  },
  listContent: {
    padding: 16,
  },
  planCard: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  planMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 8,
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default PlanOverviewScreen;
