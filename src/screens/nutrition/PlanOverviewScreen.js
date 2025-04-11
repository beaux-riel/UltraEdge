import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Searchbar, 
  Chip, 
  Menu, 
  Divider, 
  IconButton,
  FAB
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';
import { useNutritionHydration } from '../../context/NutritionHydrationContext';

/**
 * Screen to display an overview of all nutrition and hydration plans
 * @param {Object} props - Component props
 * @param {Object} props.navigation - React Navigation object
 */
const PlanOverviewScreen = ({ navigation }) => {
  const { theme, isDarkMode } = useAppTheme();
  const { 
    nutritionPlans, 
    hydrationPlans, 
    deleteNutritionPlan, 
    deleteHydrationPlan,
    createNutritionPlan,
    createHydrationPlan
  } = useNutritionHydration();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [activePlanId, setActivePlanId] = useState(null);
  const [activePlanType, setActivePlanType] = useState(null);
  
  // Combine and format plans for display
  const getFormattedPlans = () => {
    const formattedNutritionPlans = Object.entries(nutritionPlans).map(([id, plan]) => ({
      ...plan,
      id,
      type: 'nutrition'
    }));
    
    const formattedHydrationPlans = Object.entries(hydrationPlans).map(([id, plan]) => ({
      ...plan,
      id,
      type: 'hydration'
    }));
    
    let combinedPlans = [];
    
    if (filterType === 'all' || filterType === 'nutrition') {
      combinedPlans = [...combinedPlans, ...formattedNutritionPlans];
    }
    
    if (filterType === 'all' || filterType === 'hydration') {
      combinedPlans = [...combinedPlans, ...formattedHydrationPlans];
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      combinedPlans = combinedPlans.filter(plan => 
        plan.name.toLowerCase().includes(query) || 
        (plan.description && plan.description.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    combinedPlans.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        comparison = dateA - dateB;
      } else if (sortBy === 'type') {
        comparison = a.type.localeCompare(b.type);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return combinedPlans;
  };
  
  // Show context menu for a plan
  const showMenu = (event, planId, planType) => {
    setMenuAnchor({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    setMenuVisible(true);
    setActivePlanId(planId);
    setActivePlanType(planType);
  };
  
  // Handle view plan
  const handleViewPlan = () => {
    setMenuVisible(false);
    if (activePlanId && activePlanType) {
      navigation.navigate(
        activePlanType === 'nutrition' ? 'NutritionPlanDetail' : 'HydrationPlanDetail',
        { planId: activePlanId }
      );
    }
  };
  
  // Handle edit plan
  const handleEditPlan = () => {
    setMenuVisible(false);
    if (activePlanId && activePlanType) {
      navigation.navigate(
        activePlanType === 'nutrition' ? 'EditNutritionPlan' : 'EditHydrationPlan',
        { planId: activePlanId }
      );
    }
  };
  
  // Handle duplicate plan
  const handleDuplicatePlan = () => {
    setMenuVisible(false);
    if (activePlanId && activePlanType) {
      const plan = activePlanType === 'nutrition' 
        ? nutritionPlans[activePlanId]
        : hydrationPlans[activePlanId];
        
      if (plan) {
        const duplicatedPlan = {
          ...plan,
          name: `${plan.name} (Copy)`,
          entries: [...(plan.entries || [])]
        };
        
        if (activePlanType === 'nutrition') {
          createNutritionPlan(duplicatedPlan).then(result => {
            if (result.success) {
              Alert.alert('Success', 'Plan duplicated successfully');
            }
          });
        } else {
          createHydrationPlan(duplicatedPlan).then(result => {
            if (result.success) {
              Alert.alert('Success', 'Plan duplicated successfully');
            }
          });
        }
      }
    }
  };
  
  // Handle delete plan
  const handleDeletePlan = () => {
    setMenuVisible(false);
    if (activePlanId && activePlanType) {
      Alert.alert(
        'Delete Plan',
        'Are you sure you want to delete this plan? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              if (activePlanType === 'nutrition') {
                deleteNutritionPlan(activePlanId);
              } else {
                deleteHydrationPlan(activePlanId);
              }
            }
          }
        ]
      );
    }
  };
  
  // Handle create new plan
  const handleCreatePlan = (type) => {
    navigation.navigate(
      type === 'nutrition' ? 'CreateNutritionPlan' : 'CreateHydrationPlan'
    );
  };
  
  // Render a plan card
  const renderPlanCard = ({ item }) => {
    const isNutrition = item.type === 'nutrition';
    const planIcon = isNutrition ? 'food-apple' : 'water';
    const planColor = isNutrition ? theme.colors.primary : theme.colors.secondary;
    
    return (
      <Card 
        style={styles.planCard}
        onPress={() => navigation.navigate(
          isNutrition ? 'NutritionPlanDetail' : 'HydrationPlanDetail',
          { planId: item.id }
        )}
      >
        <Card.Title
          title={item.name}
          left={(props) => (
            <MaterialCommunityIcons
              name={planIcon}
              size={props.size}
              color={planColor}
            />
          )}
          right={(props) => (
            <IconButton
              icon="dots-vertical"
              size={props.size}
              onPress={(e) => showMenu(e, item.id, item.type)}
            />
          )}
        />
        
        <Card.Content>
          {item.description && (
            <Text numberOfLines={2} style={styles.description}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.planDetails}>
            {item.raceType && (
              <Chip style={styles.detailChip} icon="run">
                {item.raceType}
              </Chip>
            )}
            
            {item.intensityLevel && (
              <Chip style={styles.detailChip} icon="lightning-bolt">
                {item.intensityLevel}
              </Chip>
            )}
            
            {item.entries && (
              <Chip style={styles.detailChip} icon="format-list-bulleted">
                {item.entries.length} entries
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render empty list message
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="clipboard-text-outline"
        size={48}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.emptyText}>No plans found</Text>
      <Text style={styles.emptySubtext}>
        {searchQuery 
          ? 'Try a different search term or filter'
          : 'Create your first nutrition or hydration plan'}
      </Text>
      
      {!searchQuery && (
        <View style={styles.emptyActions}>
          <Button 
            mode="contained" 
            onPress={() => handleCreatePlan('nutrition')}
            style={[styles.emptyActionButton, { marginRight: 8 }]}
            icon="food-apple"
          >
            Nutrition Plan
          </Button>
          <Button 
            mode="contained" 
            onPress={() => handleCreatePlan('hydration')}
            style={styles.emptyActionButton}
            icon="water"
          >
            Hydration Plan
          </Button>
        </View>
      )}
    </View>
  );
  
  // Render list header with search and filters
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Searchbar
        placeholder="Search plans..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />
      
      <View style={styles.filterContainer}>
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Type:</Text>
          <SegmentedButtons
            value={filterType}
            onValueChange={setFilterType}
            buttons={[
              { value: 'all', label: 'All' },
              { value: 'nutrition', label: 'Nutrition' },
              { value: 'hydration', label: 'Hydration' }
            ]}
            style={styles.filterButtons}
          />
        </View>
        
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Sort by:</Text>
          <View style={styles.sortContainer}>
            <SegmentedButtons
              value={sortBy}
              onValueChange={setSortBy}
              buttons={[
                { value: 'name', label: 'Name' },
                { value: 'date', label: 'Date' },
                { value: 'type', label: 'Type' }
              ]}
              style={styles.sortButtons}
            />
            <IconButton
              icon={sortOrder === 'asc' ? 'sort-ascending' : 'sort-descending'}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            />
          </View>
        </View>
      </View>
    </View>
  );
  
  const plans = getFormattedPlans();
  
  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        renderItem={renderPlanCard}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={plans.length === 0 ? { flex: 1 } : null}
      />
      
      <FAB.Group
        open={false}
        icon="plus"
        actions={[
          {
            icon: 'food-apple',
            label: 'Nutrition Plan',
            onPress: () => handleCreatePlan('nutrition'),
          },
          {
            icon: 'water',
            label: 'Hydration Plan',
            onPress: () => handleCreatePlan('hydration'),
          },
        ]}
        onStateChange={() => {}}
        onPress={() => {}}
        fabStyle={{ backgroundColor: theme.colors.primary }}
      />
      
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={menuAnchor}
      >
        <Menu.Item 
          onPress={handleViewPlan} 
          title="View" 
          leadingIcon="eye"
        />
        <Menu.Item 
          onPress={handleEditPlan} 
          title="Edit" 
          leadingIcon="pencil"
        />
        <Menu.Item 
          onPress={() => {
            setMenuVisible(false);
            if (activePlanId && activePlanType) {
              navigation.navigate('PlanAnalytics', { planId: activePlanId, planType: activePlanType });
            }
          }} 
          title="Analytics" 
          leadingIcon="chart-bar"
        />
        <Menu.Item 
          onPress={handleDuplicatePlan} 
          title="Duplicate" 
          leadingIcon="content-copy"
        />
        <Divider />
        <Menu.Item 
          onPress={handleDeletePlan} 
          title="Delete" 
          leadingIcon="delete"
          titleStyle={{ color: theme.colors.error }}
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    padding: 16,
  },
  searchBar: {
    marginBottom: 16,
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.7,
  },
  filterButtons: {
    marginBottom: 8,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtons: {
    flex: 1,
  },
  planCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  description: {
    marginBottom: 8,
  },
  planDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  detailChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyActions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emptyActionButton: {
    minWidth: 150,
  },
});

export default PlanOverviewScreen;