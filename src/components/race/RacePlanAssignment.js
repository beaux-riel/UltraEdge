import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Divider, 
  List, 
  Chip, 
  Menu, 
  IconButton,
  SegmentedButtons,
  Portal,
  Modal,
  RadioButton
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Component for assigning nutrition and hydration plans to races
 * @param {Object} props - Component props
 * @param {Array} props.races - Array of race objects
 * @param {Array} props.nutritionPlans - Array of nutrition plan objects
 * @param {Array} props.hydrationPlans - Array of hydration plan objects
 * @param {Array} props.assignments - Array of existing race-plan assignments
 * @param {function} props.onAssignPlan - Function called when a plan is assigned to a race
 * @param {function} props.onUnassignPlan - Function called when a plan is unassigned from a race
 * @param {function} props.onUpdateAssignment - Function called when an assignment is updated
 */
const RacePlanAssignment = ({ 
  races = [], 
  nutritionPlans = [], 
  hydrationPlans = [], 
  assignments = [],
  onAssignPlan,
  onUnassignPlan,
  onUpdateAssignment
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [selectedRace, setSelectedRace] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [activeAssignmentId, setActiveAssignmentId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('assign'); // 'assign' or 'sequence'
  const [selectedPlanType, setSelectedPlanType] = useState('nutrition');
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [selectedSequence, setSelectedSequence] = useState('all');
  
  // Handle race selection
  const handleRaceSelection = (race) => {
    setSelectedRace(race);
  };
  
  // Show context menu for an assignment
  const showMenu = (event, assignmentId) => {
    setMenuAnchor({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    setMenuVisible(true);
    setActiveAssignmentId(assignmentId);
  };
  
  // Show assign plan modal
  const showAssignModal = () => {
    if (!selectedRace) {
      Alert.alert('Error', 'Please select a race first');
      return;
    }
    
    setModalType('assign');
    setSelectedPlanType('nutrition');
    setSelectedPlanId(null);
    setModalVisible(true);
  };
  
  // Show sequence modal
  const showSequenceModal = (assignmentId) => {
    setModalType('sequence');
    setActiveAssignmentId(assignmentId);
    
    // Find current sequence
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment) {
      setSelectedSequence(assignment.sequence || 'all');
    } else {
      setSelectedSequence('all');
    }
    
    setMenuVisible(false);
    setModalVisible(true);
  };
  
  // Handle assign plan
  const handleAssignPlan = () => {
    if (!selectedRace || !selectedPlanId) {
      Alert.alert('Error', 'Please select both a race and a plan');
      return;
    }
    
    // Check if plan is already assigned to this race
    const existingAssignment = assignments.find(
      a => a.raceId === selectedRace.id && 
           a.planId === selectedPlanId && 
           a.planType === selectedPlanType
    );
    
    if (existingAssignment) {
      Alert.alert('Error', 'This plan is already assigned to this race');
      return;
    }
    
    onAssignPlan({
      raceId: selectedRace.id,
      planId: selectedPlanId,
      planType: selectedPlanType,
      sequence: 'all'
    });
    
    setModalVisible(false);
  };
  
  // Handle unassign plan
  const handleUnassignPlan = () => {
    if (!activeAssignmentId) return;
    
    Alert.alert(
      'Unassign Plan',
      'Are you sure you want to unassign this plan from the race?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unassign', 
          style: 'destructive',
          onPress: () => {
            onUnassignPlan(activeAssignmentId);
            setMenuVisible(false);
          }
        }
      ]
    );
  };
  
  // Handle update sequence
  const handleUpdateSequence = () => {
    if (!activeAssignmentId) return;
    
    onUpdateAssignment(activeAssignmentId, { sequence: selectedSequence });
    setModalVisible(false);
  };
  
  // Get race assignments
  const getRaceAssignments = (raceId) => {
    return assignments.filter(a => a.raceId === raceId);
  };
  
  // Get plan name by id and type
  const getPlanName = (planId, planType) => {
    if (planType === 'nutrition') {
      const plan = nutritionPlans.find(p => p.id === planId);
      return plan ? plan.name : 'Unknown Plan';
    } else {
      const plan = hydrationPlans.find(p => p.id === planId);
      return plan ? plan.name : 'Unknown Plan';
    }
  };
  
  // Get sequence label
  const getSequenceLabel = (sequence) => {
    switch (sequence) {
      case 'early':
        return 'Early Race';
      case 'mid':
        return 'Mid Race';
      case 'late':
        return 'Late Race';
      case 'all':
      default:
        return 'Entire Race';
    }
  };
  
  // Get sequence icon
  const getSequenceIcon = (sequence) => {
    switch (sequence) {
      case 'early':
        return 'flag-start';
      case 'mid':
        return 'flag-checkered';
      case 'late':
        return 'flag-finish';
      case 'all':
      default:
        return 'flag-outline';
    }
  };
  
  // Render race list
  const renderRaceList = () => {
    if (races.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyText}>No races available</Text>
            <Button 
              mode="contained" 
              onPress={() => {}} 
              style={styles.createButton}
            >
              Create Race
            </Button>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Select Race" />
        <Card.Content>
          <ScrollView style={styles.raceList}>
            {races.map(race => {
              const isSelected = selectedRace && selectedRace.id === race.id;
              const raceAssignments = getRaceAssignments(race.id);
              
              return (
                <List.Item
                  key={race.id}
                  title={race.name}
                  description={race.date}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    />
                  )}
                  right={props => (
                    <View style={styles.assignmentIndicators}>
                      {raceAssignments.some(a => a.planType === 'nutrition') && (
                        <MaterialCommunityIcons
                          name="food-apple"
                          size={20}
                          color={theme.colors.primary}
                          style={styles.indicator}
                        />
                      )}
                      {raceAssignments.some(a => a.planType === 'hydration') && (
                        <MaterialCommunityIcons
                          name="water"
                          size={20}
                          color={theme.colors.secondary}
                          style={styles.indicator}
                        />
                      )}
                    </View>
                  )}
                  onPress={() => handleRaceSelection(race)}
                  style={[
                    styles.raceItem,
                    isSelected && { backgroundColor: theme.colors.primaryContainer }
                  ]}
                />
              );
            })}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };
  
  // Render assignments
  const renderAssignments = () => {
    if (!selectedRace) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyText}>Select a race to view assignments</Text>
          </Card.Content>
        </Card>
      );
    }
    
    const raceAssignments = getRaceAssignments(selectedRace.id);
    
    return (
      <Card style={styles.card}>
        <Card.Title 
          title="Plan Assignments" 
          subtitle={selectedRace.name}
          right={(props) => (
            <Button 
              mode="contained" 
              onPress={showAssignModal}
              style={{ marginRight: 16 }}
            >
              Assign Plan
            </Button>
          )}
        />
        <Card.Content>
          {raceAssignments.length === 0 ? (
            <Text style={styles.emptyText}>No plans assigned to this race</Text>
          ) : (
            <List.Section>
              {raceAssignments.map(assignment => (
                <List.Item
                  key={assignment.id}
                  title={getPlanName(assignment.planId, assignment.planType)}
                  description={() => (
                    <View style={styles.assignmentDetails}>
                      <Chip 
                        icon={assignment.planType === 'nutrition' ? 'food-apple' : 'water'}
                        style={[
                          styles.typeChip,
                          { 
                            backgroundColor: assignment.planType === 'nutrition' 
                              ? theme.colors.primaryContainer 
                              : theme.colors.secondaryContainer 
                          }
                        ]}
                      >
                        {assignment.planType === 'nutrition' ? 'Nutrition' : 'Hydration'}
                      </Chip>
                      <Chip 
                        icon={getSequenceIcon(assignment.sequence)}
                        style={styles.sequenceChip}
                      >
                        {getSequenceLabel(assignment.sequence)}
                      </Chip>
                    </View>
                  )}
                  right={props => (
                    <IconButton
                      {...props}
                      icon="dots-vertical"
                      onPress={(e) => showMenu(e, assignment.id)}
                    />
                  )}
                  style={styles.assignmentItem}
                />
              ))}
            </List.Section>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  // Render assign modal
  const renderAssignModal = () => {
    return (
      <Card>
        <Card.Title title="Assign Plan to Race" />
        <Card.Content>
          <Text style={styles.modalSubtitle}>Race: {selectedRace?.name}</Text>
          
          <View style={styles.planTypeSelector}>
            <Text style={styles.sectionTitle}>Plan Type</Text>
            <SegmentedButtons
              value={selectedPlanType}
              onValueChange={setSelectedPlanType}
              buttons={[
                { value: 'nutrition', label: 'Nutrition' },
                { value: 'hydration', label: 'Hydration' }
              ]}
            />
          </View>
          
          <View style={styles.planSelector}>
            <Text style={styles.sectionTitle}>Select Plan</Text>
            <RadioButton.Group
              value={selectedPlanId || ''}
              onValueChange={setSelectedPlanId}
            >
              <ScrollView style={styles.planList}>
                {(selectedPlanType === 'nutrition' ? nutritionPlans : hydrationPlans).map(plan => (
                  <RadioButton.Item
                    key={plan.id}
                    label={plan.name}
                    value={plan.id}
                    status={selectedPlanId === plan.id ? 'checked' : 'unchecked'}
                  />
                ))}
              </ScrollView>
            </RadioButton.Group>
          </View>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={handleAssignPlan}
            disabled={!selectedPlanId}
          >
            Assign
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  // Render sequence modal
  const renderSequenceModal = () => {
    return (
      <Card>
        <Card.Title title="Set Race Sequence" />
        <Card.Content>
          <Text style={styles.modalSubtitle}>
            When should this plan be used during the race?
          </Text>
          
          <RadioButton.Group
            value={selectedSequence}
            onValueChange={setSelectedSequence}
          >
            <RadioButton.Item
              label="Entire Race"
              value="all"
            />
            <RadioButton.Item
              label="Early Race"
              value="early"
            />
            <RadioButton.Item
              label="Mid Race"
              value="mid"
            />
            <RadioButton.Item
              label="Late Race"
              value="late"
            />
          </RadioButton.Group>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={handleUpdateSequence}
          >
            Save
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      {renderRaceList()}
      {renderAssignments()}
      
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={menuAnchor}
      >
        <Menu.Item 
          onPress={() => showSequenceModal(activeAssignmentId)} 
          title="Set Sequence" 
          leadingIcon="flag-outline"
        />
        <Divider />
        <Menu.Item 
          onPress={handleUnassignPlan} 
          title="Unassign" 
          leadingIcon="link-off"
          titleStyle={{ color: theme.colors.error }}
        />
      </Menu>
      
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {modalType === 'assign' ? renderAssignModal() : renderSequenceModal()}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  card: {
    marginVertical: 8,
  },
  raceList: {
    maxHeight: 200,
  },
  raceItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  assignmentIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    marginLeft: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  createButton: {
    marginTop: 8,
  },
  assignmentDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  typeChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  sequenceChip: {
    marginBottom: 4,
  },
  assignmentItem: {
    marginBottom: 4,
  },
  modalContainer: {
    padding: 16,
    margin: 16,
  },
  modalSubtitle: {
    marginBottom: 16,
  },
  planTypeSelector: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planSelector: {
    marginBottom: 16,
  },
  planList: {
    maxHeight: 200,
  },
});

export default RacePlanAssignment;