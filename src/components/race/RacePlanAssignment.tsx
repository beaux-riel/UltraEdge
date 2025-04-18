import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Divider, 
  List, 
  Chip, 
  Switch,
  Portal,
  Modal,
  RadioButton
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { 
  NutritionPlan, 
  HydrationPlan, 
  RacePlanAssignment as RacePlanAssignmentType,
  useNutritionHydration 
} from '../../context/NutritionHydrationContext';

interface Race {
  id: string;
  name: string;
  date: string;
  distance: number;
  distanceUnit: string;
  aidStations?: Array<{
    id: string;
    name: string;
    distance: number;
    cutoff?: string;
    dropBags?: boolean;
    crew?: boolean;
  }>;
}

interface RacePlanAssignmentProps {
  race: Race | null;
  nutritionPlans: NutritionPlan[];
  hydrationPlans: HydrationPlan[];
}

/**
 * Component for assigning nutrition and hydration plans to races
 */
const RacePlanAssignment: React.FC<RacePlanAssignmentProps> = ({ 
  race, 
  nutritionPlans, 
  hydrationPlans 
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const { 
    racePlanAssignments, 
    createRacePlanAssignment, 
    updateRacePlanAssignment, 
    getRacePlanAssignmentsByRaceId 
  } = useNutritionHydration();
  
  const [assignment, setAssignment] = useState<Partial<RacePlanAssignmentType> | null>(null);
  const [existingAssignmentId, setExistingAssignmentId] = useState<string | null>(null);
  const [nutritionModalVisible, setNutritionModalVisible] = useState(false);
  const [hydrationModalVisible, setHydrationModalVisible] = useState(false);
  
  // Load existing assignment when race changes
  useEffect(() => {
    if (race) {
      const existingAssignments = getRacePlanAssignmentsByRaceId(race.id);
      
      if (existingAssignments.length > 0) {
        // Use the first active assignment if available
        const activeAssignment = existingAssignments.find(a => a.isActive);
        const assignmentToUse = activeAssignment || existingAssignments[0];
        
        setAssignment({
          raceId: assignmentToUse.raceId,
          nutritionPlanId: assignmentToUse.nutritionPlanId,
          hydrationPlanId: assignmentToUse.hydrationPlanId,
          startTime: assignmentToUse.startTime || '00:00',
          endTime: assignmentToUse.endTime || '24:00',
          isActive: assignmentToUse.isActive
        });
        setExistingAssignmentId(assignmentToUse.id);
      } else {
        // Create a new assignment object
        setAssignment({
          raceId: race.id,
          nutritionPlanId: undefined,
          hydrationPlanId: undefined,
          startTime: '00:00',
          endTime: '24:00',
          isActive: true
        });
        setExistingAssignmentId(null);
      }
    } else {
      setAssignment(null);
      setExistingAssignmentId(null);
    }
  }, [race, getRacePlanAssignmentsByRaceId]);
  
  // Handle selecting a nutrition plan
  const handleSelectNutritionPlan = (planId: string) => {
    if (assignment) {
      setAssignment({
        ...assignment,
        nutritionPlanId: planId
      });
    }
    setNutritionModalVisible(false);
  };
  
  // Handle selecting a hydration plan
  const handleSelectHydrationPlan = (planId: string) => {
    if (assignment) {
      setAssignment({
        ...assignment,
        hydrationPlanId: planId
      });
    }
    setHydrationModalVisible(false);
  };
  
  // Handle toggling active status
  const handleToggleActive = () => {
    if (assignment) {
      setAssignment({
        ...assignment,
        isActive: !assignment.isActive
      });
    }
  };
  
  // Handle saving the assignment
  const handleSaveAssignment = async () => {
    if (!assignment || !race) return;
    
    // Validate assignment
    if (!assignment.nutritionPlanId && !assignment.hydrationPlanId) {
      Alert.alert('Error', 'Please select at least one nutrition or hydration plan');
      return;
    }
    
    try {
      let result;
      
      if (existingAssignmentId) {
        // Update existing assignment
        result = await updateRacePlanAssignment(existingAssignmentId, assignment);
      } else {
        // Create new assignment
        result = await createRacePlanAssignment(assignment as Omit<RacePlanAssignmentType, 'id' | 'createdAt' | 'updatedAt'>);
        if (result.success && result.assignmentId) {
          setExistingAssignmentId(result.assignmentId);
        }
      }
      
      if (result.success) {
        Alert.alert('Success', 'Plan assignment saved successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to save plan assignment');
      }
    } catch (error) {
      console.error('Error saving plan assignment:', error);
      Alert.alert('Error', 'An unexpected error occurred while saving the plan assignment');
    }
  };
  
  // Render nutrition plan selection modal
  const renderNutritionPlanModal = () => (
    <Portal>
      <Modal
        visible={nutritionModalVisible}
        onDismiss={() => setNutritionModalVisible(false)}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
        ]}
      >
        <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Select Nutrition Plan
        </Text>
        
        <RadioButton.Group
          onValueChange={handleSelectNutritionPlan}
          value={assignment?.nutritionPlanId || ''}
        >
          {nutritionPlans.map((plan) => (
            <RadioButton.Item
              key={plan.id}
              label={plan.name}
              value={plan.id}
              style={styles.radioItem}
              labelStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
            />
          ))}
        </RadioButton.Group>
        
        <Button
          mode="contained"
          onPress={() => setNutritionModalVisible(false)}
          style={styles.modalButton}
        >
          Cancel
        </Button>
      </Modal>
    </Portal>
  );
  
  // Render hydration plan selection modal
  const renderHydrationPlanModal = () => (
    <Portal>
      <Modal
        visible={hydrationModalVisible}
        onDismiss={() => setHydrationModalVisible(false)}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
        ]}
      >
        <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Select Hydration Plan
        </Text>
        
        <RadioButton.Group
          onValueChange={handleSelectHydrationPlan}
          value={assignment?.hydrationPlanId || ''}
        >
          {hydrationPlans.map((plan) => (
            <RadioButton.Item
              key={plan.id}
              label={plan.name}
              value={plan.id}
              style={styles.radioItem}
              labelStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
            />
          ))}
        </RadioButton.Group>
        
        <Button
          mode="contained"
          onPress={() => setHydrationModalVisible(false)}
          style={styles.modalButton}
        >
          Cancel
        </Button>
      </Modal>
    </Portal>
  );
  
  // If no race is selected, show message
  if (!race) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
          Please select a race to assign plans
        </Text>
      </View>
    );
  }
  
  // Get selected nutrition plan
  const selectedNutritionPlan = assignment?.nutritionPlanId
    ? nutritionPlans.find(plan => plan.id === assignment.nutritionPlanId)
    : undefined;
    
  // Get selected hydration plan
  const selectedHydrationPlan = assignment?.hydrationPlanId
    ? hydrationPlans.find(plan => plan.id === assignment.hydrationPlanId)
    : undefined;
  
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Assign Plans to Race" />
        <Card.Content>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Nutrition Plan
          </Text>
          
          {selectedNutritionPlan ? (
            <View style={styles.selectedPlanContainer}>
              <Text style={[styles.planName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {selectedNutritionPlan.name}
              </Text>
              <Text style={[styles.planDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {selectedNutritionPlan.description || 'No description'}
              </Text>
              <Text style={[styles.planMeta, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {selectedNutritionPlan.entries.length} items • 
                {selectedNutritionPlan.entries.reduce((sum, entry) => sum + (entry.calories || 0), 0)} calories
              </Text>
              
              <Button
                mode="outlined"
                onPress={() => setNutritionModalVisible(true)}
                style={styles.changePlanButton}
              >
                Change Plan
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setNutritionModalVisible(true)}
              style={styles.selectPlanButton}
            >
              Select Nutrition Plan
            </Button>
          )}
          
          <Divider style={styles.divider} />
          
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Hydration Plan
          </Text>
          
          {selectedHydrationPlan ? (
            <View style={styles.selectedPlanContainer}>
              <Text style={[styles.planName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                {selectedHydrationPlan.name}
              </Text>
              <Text style={[styles.planDescription, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {selectedHydrationPlan.description || 'No description'}
              </Text>
              <Text style={[styles.planMeta, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {selectedHydrationPlan.entries.length} items • 
                {selectedHydrationPlan.entries.reduce((sum, entry) => sum + (entry.volume || 0), 0)} ml
              </Text>
              
              <Button
                mode="outlined"
                onPress={() => setHydrationModalVisible(true)}
                style={styles.changePlanButton}
              >
                Change Plan
              </Button>
            </View>
          ) : (
            <Button
              mode="contained"
              onPress={() => setHydrationModalVisible(true)}
              style={styles.selectPlanButton}
            >
              Select Hydration Plan
            </Button>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.switchContainer}>
            <Text style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
              Active
            </Text>
            <Switch
              value={assignment?.isActive || false}
              onValueChange={handleToggleActive}
            />
          </View>
          
          <Button
            mode="contained"
            onPress={handleSaveAssignment}
            style={styles.saveButton}
            disabled={!assignment?.nutritionPlanId && !assignment?.hydrationPlanId}
          >
            Save Assignment
          </Button>
        </Card.Content>
      </Card>
      
      {renderNutritionPlanModal()}
      {renderHydrationPlanModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedPlanContainer: {
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDescription: {
    marginBottom: 8,
  },
  planMeta: {
    marginBottom: 8,
  },
  selectPlanButton: {
    marginBottom: 16,
  },
  changePlanButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  radioItem: {
    marginVertical: 4,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default RacePlanAssignment;