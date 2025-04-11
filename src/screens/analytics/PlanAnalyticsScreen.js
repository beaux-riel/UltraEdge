import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  SegmentedButtons, 
  Divider,
  Portal,
  Modal,
  IconButton,
  FAB
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { useNutritionHydration } from '../../context/NutritionHydrationContext';
import TimelineVisualization from '../../components/visualization/TimelineVisualization';
import NutritionAnalytics from '../../components/analytics/NutritionAnalytics';
import HydrationAnalytics from '../../components/analytics/HydrationAnalytics';
import RuleConditionBuilder from '../../components/rules/RuleConditionBuilder';
import PlanComparisonTool from '../../components/analytics/PlanComparisonTool';

/**
 * Screen for plan analytics and visualization
 * @param {Object} props - Component props
 * @param {Object} props.navigation - React Navigation object
 * @param {Object} props.route - React Navigation route object
 */
const PlanAnalyticsScreen = ({ navigation, route }) => {
  const { theme, isDarkMode } = useAppTheme();
  const { 
    nutritionPlans, 
    hydrationPlans,
    updateNutritionPlan,
    updateHydrationPlan,
    createNutritionPlan,
    createHydrationPlan
  } = useNutritionHydration();
  
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedPlanType, setSelectedPlanType] = useState('nutrition');
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [displayMode, setDisplayMode] = useState('time');
  const [rules, setRules] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  
  const { planId, planType } = route.params || {};
  
  // Initialize selected plan from route params
  useEffect(() => {
    if (planId && planType) {
      setSelectedPlanId(planId);
      setSelectedPlanType(planType);
    } else if (Object.keys(nutritionPlans).length > 0) {
      setSelectedPlanId(Object.keys(nutritionPlans)[0]);
      setSelectedPlanType('nutrition');
    } else if (Object.keys(hydrationPlans).length > 0) {
      setSelectedPlanId(Object.keys(hydrationPlans)[0]);
      setSelectedPlanType('hydration');
    }
  }, [planId, planType, nutritionPlans, hydrationPlans]);
  
  // Load rules for selected plan
  useEffect(() => {
    if (selectedPlanId) {
      const plan = selectedPlanType === 'nutrition'
        ? nutritionPlans[selectedPlanId]
        : hydrationPlans[selectedPlanId];
        
      if (plan && plan.rules) {
        setRules(plan.rules);
      } else {
        setRules([]);
      }
    }
  }, [selectedPlanId, selectedPlanType, nutritionPlans, hydrationPlans]);
  
  // Get selected plan data
  const getSelectedPlan = () => {
    if (!selectedPlanId) return null;
    
    return selectedPlanType === 'nutrition'
      ? nutritionPlans[selectedPlanId]
      : hydrationPlans[selectedPlanId];
  };
  
  // Get all plans of selected type
  const getAllPlans = () => {
    return selectedPlanType === 'nutrition'
      ? Object.values(nutritionPlans)
      : Object.values(hydrationPlans);
  };
  
  // Handle adding a rule
  const handleAddRule = (rule) => {
    const newRules = [...rules, rule];
    setRules(newRules);
    
    // Save rules to plan
    saveRulesToPlan(newRules);
  };
  
  // Handle updating a rule
  const handleUpdateRule = (updatedRule) => {
    const newRules = rules.map(rule => 
      rule.id === updatedRule.id ? updatedRule : rule
    );
    setRules(newRules);
    
    // Save rules to plan
    saveRulesToPlan(newRules);
  };
  
  // Handle deleting a rule
  const handleDeleteRule = (ruleId) => {
    const newRules = rules.filter(rule => rule.id !== ruleId);
    setRules(newRules);
    
    // Save rules to plan
    saveRulesToPlan(newRules);
  };
  
  // Save rules to plan
  const saveRulesToPlan = (newRules) => {
    const plan = getSelectedPlan();
    if (!plan) return;
    
    const updatedPlan = {
      ...plan,
      rules: newRules
    };
    
    if (selectedPlanType === 'nutrition') {
      updateNutritionPlan(selectedPlanId, updatedPlan);
    } else {
      updateHydrationPlan(selectedPlanId, updatedPlan);
    }
  };
  
  // Handle merging plans
  const handleMergePlans = (plansToMerge) => {
    if (plansToMerge.length !== 2) return;
    
    // Show confirmation modal
    setModalContent({
      type: 'merge-confirmation',
      plans: plansToMerge
    });
    setModalVisible(true);
  };
  
  // Perform plan merge
  const performPlanMerge = (plansToMerge) => {
    const [plan1, plan2] = plansToMerge;
    
    // Create a new plan with merged data
    const mergedPlan = {
      name: `${plan1.name} + ${plan2.name}`,
      description: `Merged plan from ${plan1.name} and ${plan2.name}`,
      raceType: plan1.raceType || plan2.raceType,
      raceDuration: plan1.raceDuration || plan2.raceDuration,
      terrainType: plan1.terrainType || plan2.terrainType,
      weatherCondition: plan1.weatherCondition || plan2.weatherCondition,
      intensityLevel: plan1.intensityLevel || plan2.intensityLevel,
      entries: []
    };
    
    // Merge entries
    const entriesMap = new Map();
    
    // Add entries from plan1
    plan1.entries?.forEach(entry => {
      const key = selectedPlanType === 'nutrition' ? entry.foodType : entry.liquidType;
      entriesMap.set(key, { ...entry });
    });
    
    // Add or update entries from plan2
    plan2.entries?.forEach(entry => {
      const key = selectedPlanType === 'nutrition' ? entry.foodType : entry.liquidType;
      
      if (entriesMap.has(key)) {
        // Entry exists in both plans, use the one with higher values
        const existingEntry = entriesMap.get(key);
        
        if (selectedPlanType === 'nutrition') {
          entriesMap.set(key, {
            ...existingEntry,
            calories: Math.max(existingEntry.calories || 0, entry.calories || 0),
            carbs: Math.max(existingEntry.carbs || 0, entry.carbs || 0),
            protein: Math.max(existingEntry.protein || 0, entry.protein || 0),
            fat: Math.max(existingEntry.fat || 0, entry.fat || 0),
            sodium: Math.max(existingEntry.sodium || 0, entry.sodium || 0),
            potassium: Math.max(existingEntry.potassium || 0, entry.potassium || 0),
            magnesium: Math.max(existingEntry.magnesium || 0, entry.magnesium || 0)
          });
        } else {
          entriesMap.set(key, {
            ...existingEntry,
            volume: Math.max(existingEntry.volume || 0, entry.volume || 0),
            electrolytes: {
              sodium: Math.max(existingEntry.electrolytes?.sodium || 0, entry.electrolytes?.sodium || 0),
              potassium: Math.max(existingEntry.electrolytes?.potassium || 0, entry.electrolytes?.potassium || 0),
              magnesium: Math.max(existingEntry.electrolytes?.magnesium || 0, entry.electrolytes?.magnesium || 0)
            }
          });
        }
      } else {
        // Entry only in plan2
        entriesMap.set(key, { ...entry });
      }
    });
    
    // Convert map to array
    mergedPlan.entries = Array.from(entriesMap.values());
    
    // Create the merged plan
    if (selectedPlanType === 'nutrition') {
      createNutritionPlan(mergedPlan).then(result => {
        if (result.success) {
          setSelectedPlanId(result.planId);
          setModalVisible(false);
        }
      });
    } else {
      createHydrationPlan(mergedPlan).then(result => {
        if (result.success) {
          setSelectedPlanId(result.planId);
          setModalVisible(false);
        }
      });
    }
  };
  
  // Render plan selector
  const renderPlanSelector = () => {
    const plans = selectedPlanType === 'nutrition'
      ? Object.entries(nutritionPlans)
      : Object.entries(hydrationPlans);
      
    if (plans.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={{ textAlign: 'center' }}>
              No {selectedPlanType} plans available. Create a plan first.
            </Text>
            <Button
              mode="contained"
              onPress={() => navigation.navigate(
                selectedPlanType === 'nutrition' ? 'CreateNutritionPlan' : 'CreateHydrationPlan'
              )}
              style={styles.createButton}
            >
              Create Plan
            </Button>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.selectorRow}>
            <SegmentedButtons
              value={selectedPlanType}
              onValueChange={setSelectedPlanType}
              buttons={[
                { value: 'nutrition', label: 'Nutrition' },
                { value: 'hydration', label: 'Hydration' }
              ]}
              style={styles.planTypeSelector}
            />
            
            <SegmentedButtons
              value={selectedPlanId || ''}
              onValueChange={setSelectedPlanId}
              buttons={plans.map(([id, plan]) => ({ 
                value: id, 
                label: plan.name.substring(0, 15) + (plan.name.length > 15 ? '...' : '')
              }))}
              style={styles.planSelector}
            />
          </View>
          
          <View style={styles.displayModeRow}>
            <Text style={{ color: isDarkMode ? '#fff' : '#000' }}>Display Mode:</Text>
            <SegmentedButtons
              value={displayMode}
              onValueChange={setDisplayMode}
              buttons={[
                { value: 'time', label: 'Time' },
                { value: 'distance', label: 'Distance' }
              ]}
              style={styles.displayModeSelector}
            />
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render tab selector
  const renderTabSelector = () => {
    return (
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'timeline', label: 'Timeline' },
          { value: 'analytics', label: 'Analytics' },
          { value: 'rules', label: 'Rules' },
          { value: 'compare', label: 'Compare' }
        ]}
        style={styles.tabSelector}
      />
    );
  };
  
  // Render timeline tab
  const renderTimelineTab = () => {
    const selectedPlan = getSelectedPlan();
    if (!selectedPlan) return null;
    
    const raceInfo = {
      duration: selectedPlan.raceDuration ? parseFloat(selectedPlan.raceDuration) * 60 : 720, // Convert to minutes
      distance: 50, // Default distance
      milestones: [
        { name: 'Start', time: 0, distance: 0 },
        { name: 'Finish', time: selectedPlan.raceDuration ? parseFloat(selectedPlan.raceDuration) * 60 : 720, distance: 50 }
      ]
    };
    
    return (
      <TimelineVisualization
        nutritionEntries={selectedPlanType === 'nutrition' ? selectedPlan.entries || [] : []}
        hydrationEntries={selectedPlanType === 'hydration' ? selectedPlan.entries || [] : []}
        raceInfo={raceInfo}
        mode={displayMode}
        onEntryPress={(entry) => {
          navigation.navigate(
            selectedPlanType === 'nutrition' ? 'EditNutritionEntry' : 'EditHydrationEntry',
            { planId: selectedPlanId, entryId: entry.id }
          );
        }}
      />
    );
  };
  
  // Render analytics tab
  const renderAnalyticsTab = () => {
    const selectedPlan = getSelectedPlan();
    if (!selectedPlan) return null;
    
    const raceInfo = {
      duration: selectedPlan.raceDuration ? parseFloat(selectedPlan.raceDuration) * 60 : 720, // Convert to minutes
      distance: 50, // Default distance
      weather: selectedPlan.weatherCondition?.toLowerCase() || 'moderate',
      intensity: selectedPlan.intensityLevel?.toLowerCase() || 'moderate'
    };
    
    if (selectedPlanType === 'nutrition') {
      return (
        <NutritionAnalytics
          nutritionEntries={selectedPlan.entries || []}
          raceInfo={raceInfo}
          mode={displayMode}
        />
      );
    } else {
      return (
        <HydrationAnalytics
          hydrationEntries={selectedPlan.entries || []}
          raceInfo={raceInfo}
          mode={displayMode}
        />
      );
    }
  };
  
  // Render rules tab
  const renderRulesTab = () => {
    return (
      <RuleConditionBuilder
        rules={rules}
        onAddRule={handleAddRule}
        onUpdateRule={handleUpdateRule}
        onDeleteRule={handleDeleteRule}
      />
    );
  };
  
  // Render compare tab
  const renderCompareTab = () => {
    const plans = getAllPlans();
    
    return (
      <PlanComparisonTool
        plans={plans}
        planType={selectedPlanType}
        onMergePlans={handleMergePlans}
      />
    );
  };
  
  // Render modal content
  const renderModalContent = () => {
    if (!modalContent) return null;
    
    if (modalContent.type === 'merge-confirmation') {
      return (
        <Card>
          <Card.Title title="Merge Plans" />
          <Card.Content>
            <Text style={styles.modalText}>
              Are you sure you want to merge these plans?
            </Text>
            <Text style={styles.modalSubtext}>
              This will create a new plan combining entries from both plans.
            </Text>
            <Text style={styles.planName}>
              1. {modalContent.plans[0].name}
            </Text>
            <Text style={styles.planName}>
              2. {modalContent.plans[1].name}
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            <Button 
              mode="contained"
              onPress={() => performPlanMerge(modalContent.plans)}
            >
              Merge Plans
            </Button>
          </Card.Actions>
        </Card>
      );
    }
    
    return null;
  };
  
  return (
    <View style={styles.container}>
      {renderPlanSelector()}
      {renderTabSelector()}
      
      <View style={styles.contentContainer}>
        {activeTab === 'timeline' && renderTimelineTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'rules' && renderRulesTab()}
        {activeTab === 'compare' && renderCompareTab()}
      </View>
      
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {renderModalContent()}
        </Modal>
      </Portal>
      
      <FAB
        icon="arrow-left"
        style={styles.fab}
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  card: {
    marginBottom: 8,
  },
  selectorRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  planTypeSelector: {
    flex: 1,
    marginRight: 8,
  },
  planSelector: {
    flex: 2,
  },
  displayModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  displayModeSelector: {
    flex: 1,
    marginLeft: 8,
  },
  tabSelector: {
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
  },
  createButton: {
    marginTop: 16,
  },
  modalContainer: {
    padding: 16,
    margin: 16,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalSubtext: {
    marginBottom: 16,
    opacity: 0.7,
  },
  planName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    left: 0,
    bottom: 0,
  },
});

export default PlanAnalyticsScreen;