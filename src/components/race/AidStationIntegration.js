import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Divider, 
  List, 
  Chip, 
  DataTable,
  Checkbox,
  IconButton,
  Portal,
  Modal,
  TextInput,
  ProgressBar
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Component for integrating nutrition and hydration plans with race aid stations
 * @param {Object} props - Component props
 * @param {Object} props.race - Race object
 * @param {Array} props.aidStations - Array of aid station objects for the race
 * @param {Array} props.nutritionPlans - Array of nutrition plan objects assigned to the race
 * @param {Array} props.hydrationPlans - Array of hydration plan objects assigned to the race
 * @param {function} props.onUpdateAidStation - Function called when an aid station is updated
 * @param {function} props.onUpdateChecklist - Function called when a checklist is updated
 */
const AidStationIntegration = ({ 
  race = {}, 
  aidStations = [], 
  nutritionPlans = [], 
  hydrationPlans = [],
  onUpdateAidStation,
  onUpdateChecklist
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [selectedAidStation, setSelectedAidStation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('checklist'); // 'checklist' or 'arrival'
  const [checklist, setChecklist] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  
  // Calculate nutrition and hydration needs between aid stations
  const calculateNeeds = () => {
    if (!selectedAidStation || aidStations.length <= 1) return null;
    
    // Find the next aid station
    const currentIndex = aidStations.findIndex(as => as.id === selectedAidStation.id);
    if (currentIndex === -1 || currentIndex === aidStations.length - 1) return null;
    
    const nextAidStation = aidStations[currentIndex + 1];
    
    // Calculate distance and estimated time between stations
    const distanceBetween = nextAidStation.distance - selectedAidStation.distance;
    const paceMins = race.estimatedPace || 10; // minutes per mile
    const timeBetweenMins = distanceBetween * paceMins;
    
    // Calculate nutrition needs
    let totalCalories = 0;
    let totalCarbs = 0;
    let totalProtein = 0;
    let totalFat = 0;
    
    // Calculate based on 200-300 calories per hour for a typical runner
    const caloriesPerHour = 250;
    const caloriesNeeded = (timeBetweenMins / 60) * caloriesPerHour;
    
    // Typical macronutrient distribution for endurance
    totalCalories = Math.round(caloriesNeeded);
    totalCarbs = Math.round((caloriesNeeded * 0.6) / 4); // 60% from carbs, 4 calories per gram
    totalProtein = Math.round((caloriesNeeded * 0.15) / 4); // 15% from protein, 4 calories per gram
    totalFat = Math.round((caloriesNeeded * 0.25) / 9); // 25% from fat, 9 calories per gram
    
    // Calculate hydration needs
    // Typical recommendation is 16-32 oz (473-946 ml) per hour
    const hydrationPerHour = 700; // ml
    const hydrationNeeded = Math.round((timeBetweenMins / 60) * hydrationPerHour);
    
    return {
      distance: distanceBetween,
      time: timeBetweenMins,
      nutrition: {
        calories: totalCalories,
        carbs: totalCarbs,
        protein: totalProtein,
        fat: totalFat
      },
      hydration: {
        volume: hydrationNeeded
      }
    };
  };
  
  // Calculate carried weight
  const calculateCarriedWeight = (needs) => {
    if (!needs) return 0;
    
    // Estimate weight of nutrition (rough estimate)
    // Assume 100 calories weighs about 30g
    const nutritionWeight = (needs.nutrition.calories / 100) * 30;
    
    // Water weight (1ml = 1g)
    const waterWeight = needs.hydration.volume;
    
    // Convert to kg
    return (nutritionWeight + waterWeight) / 1000;
  };
  
  // Calculate coverage from plans
  const calculateCoverage = (needs) => {
    if (!needs) return { nutrition: 0, hydration: 0 };
    
    // Sum up all nutrition from assigned plans
    let totalCalories = 0;
    let totalWater = 0;
    
    // Add up nutrition from all assigned plans
    nutritionPlans.forEach(plan => {
      plan.entries.forEach(entry => {
        // Simplistic calculation - in reality would need to account for timing
        totalCalories += entry.calories || 0;
      });
    });
    
    // Add up hydration from all assigned plans
    hydrationPlans.forEach(plan => {
      plan.entries.forEach(entry => {
        // Convert to ml for consistency
        let volume = entry.volume || 0;
        if (entry.volumeUnit === 'oz') {
          volume *= 29.5735; // Convert oz to ml
        } else if (entry.volumeUnit === 'L') {
          volume *= 1000; // Convert L to ml
        }
        totalWater += volume;
      });
    });
    
    // Calculate coverage percentages
    const nutritionCoverage = Math.min(totalCalories / needs.nutrition.calories, 1);
    const hydrationCoverage = Math.min(totalWater / needs.hydration.volume, 1);
    
    return {
      nutrition: nutritionCoverage,
      hydration: hydrationCoverage
    };
  };
  
  // Handle aid station selection
  const handleAidStationSelection = (aidStation) => {
    setSelectedAidStation(aidStation);
    
    // Load checklist if available
    if (aidStation.checklist) {
      setChecklist(aidStation.checklist);
    } else {
      // Initialize with default items based on plans
      const defaultChecklist = [];
      
      // Add nutrition items
      nutritionPlans.forEach(plan => {
        plan.entries.forEach(entry => {
          if (entry.sourceLocation === 'aid_station') {
            defaultChecklist.push({
              id: `nutrition-${entry.id}`,
              text: `${entry.foodType} (${entry.quantity || 1} ${entry.quantityUnit || 'pcs'})`,
              checked: false,
              type: 'nutrition'
            });
          }
        });
      });
      
      // Add hydration items
      hydrationPlans.forEach(plan => {
        plan.entries.forEach(entry => {
          if (entry.sourceLocation === 'aid_station') {
            defaultChecklist.push({
              id: `hydration-${entry.id}`,
              text: `${entry.liquidType} (${entry.volume || 0} ${entry.volumeUnit || 'ml'})`,
              checked: false,
              type: 'hydration'
            });
          }
        });
      });
      
      setChecklist(defaultChecklist);
    }
    
    // Set arrival and departure times if available
    setArrivalTime(aidStation.estimatedArrival || '');
    setDepartureTime(aidStation.estimatedDeparture || '');
  };
  
  // Show checklist modal
  const showChecklistModal = () => {
    if (!selectedAidStation) {
      Alert.alert('Error', 'Please select an aid station first');
      return;
    }
    
    setModalType('checklist');
    setModalVisible(true);
  };
  
  // Show arrival time modal
  const showArrivalModal = () => {
    if (!selectedAidStation) {
      Alert.alert('Error', 'Please select an aid station first');
      return;
    }
    
    setModalType('arrival');
    setModalVisible(true);
  };
  
  // Handle checklist item toggle
  const toggleChecklistItem = (itemId) => {
    const updatedChecklist = checklist.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setChecklist(updatedChecklist);
  };
  
  // Handle add checklist item
  const addChecklistItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem = {
      id: `custom-${Date.now()}`,
      text: newItemText.trim(),
      checked: false,
      type: 'custom'
    };
    
    setChecklist([...checklist, newItem]);
    setNewItemText('');
  };
  
  // Handle remove checklist item
  const removeChecklistItem = (itemId) => {
    const updatedChecklist = checklist.filter(item => item.id !== itemId);
    setChecklist(updatedChecklist);
  };
  
  // Handle save checklist
  const saveChecklist = () => {
    if (!selectedAidStation) return;
    
    onUpdateChecklist(selectedAidStation.id, checklist);
    setModalVisible(false);
  };
  
  // Handle save arrival times
  const saveArrivalTimes = () => {
    if (!selectedAidStation) return;
    
    onUpdateAidStation(selectedAidStation.id, {
      estimatedArrival: arrivalTime,
      estimatedDeparture: departureTime
    });
    
    setModalVisible(false);
  };
  
  // Format time (minutes) to hours and minutes
  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Render aid station list
  const renderAidStationList = () => {
    if (aidStations.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyText}>No aid stations available for this race</Text>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Aid Stations" subtitle={race.name} />
        <Card.Content>
          <ScrollView style={styles.aidStationList}>
            {aidStations.map(aidStation => {
              const isSelected = selectedAidStation && selectedAidStation.id === aidStation.id;
              
              return (
                <List.Item
                  key={aidStation.id}
                  title={aidStation.name}
                  description={`Mile ${aidStation.distance}`}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    />
                  )}
                  right={props => (
                    <View style={styles.aidStationInfo}>
                      {aidStation.checklist && (
                        <MaterialCommunityIcons
                          name="clipboard-check"
                          size={20}
                          color={theme.colors.primary}
                          style={styles.indicator}
                        />
                      )}
                      {aidStation.estimatedArrival && (
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={20}
                          color={theme.colors.secondary}
                          style={styles.indicator}
                        />
                      )}
                    </View>
                  )}
                  onPress={() => handleAidStationSelection(aidStation)}
                  style={[
                    styles.aidStationItem,
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
  
  // Render aid station details
  const renderAidStationDetails = () => {
    if (!selectedAidStation) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyText}>Select an aid station to view details</Text>
          </Card.Content>
        </Card>
      );
    }
    
    const needs = calculateNeeds();
    const carriedWeight = needs ? calculateCarriedWeight(needs) : 0;
    const coverage = needs ? calculateCoverage(needs) : { nutrition: 0, hydration: 0 };
    
    return (
      <Card style={styles.card}>
        <Card.Title 
          title={selectedAidStation.name} 
          subtitle={`Mile ${selectedAidStation.distance}`}
        />
        <Card.Content>
          <View style={styles.aidStationActions}>
            <Button 
              mode="contained" 
              onPress={showChecklistModal}
              style={styles.actionButton}
              icon="clipboard-check"
            >
              Checklist
            </Button>
            <Button 
              mode="contained" 
              onPress={showArrivalModal}
              style={styles.actionButton}
              icon="clock-outline"
            >
              Arrival Times
            </Button>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.timingSection}>
            <Text style={styles.sectionTitle}>Estimated Timing</Text>
            <View style={styles.timingRow}>
              <View style={styles.timingItem}>
                <Text style={styles.timingLabel}>Arrival:</Text>
                <Text style={styles.timingValue}>
                  {selectedAidStation.estimatedArrival || 'Not set'}
                </Text>
              </View>
              <View style={styles.timingItem}>
                <Text style={styles.timingLabel}>Departure:</Text>
                <Text style={styles.timingValue}>
                  {selectedAidStation.estimatedDeparture || 'Not set'}
                </Text>
              </View>
            </View>
          </View>
          
          {needs && (
            <>
              <Divider style={styles.divider} />
              
              <View style={styles.needsSection}>
                <Text style={styles.sectionTitle}>
                  Needs to Next Aid Station ({formatTime(needs.time)})
                </Text>
                
                <DataTable>
                  <DataTable.Header>
                    <DataTable.Title>Category</DataTable.Title>
                    <DataTable.Title numeric>Needed</DataTable.Title>
                    <DataTable.Title numeric>Coverage</DataTable.Title>
                  </DataTable.Header>
                  
                  <DataTable.Row>
                    <DataTable.Cell>Calories</DataTable.Cell>
                    <DataTable.Cell numeric>{needs.nutrition.calories}</DataTable.Cell>
                    <DataTable.Cell>
                      <ProgressBar 
                        progress={coverage.nutrition} 
                        color={coverage.nutrition < 0.7 ? theme.colors.error : theme.colors.primary}
                        style={styles.progressBar}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                  
                  <DataTable.Row>
                    <DataTable.Cell>Carbs</DataTable.Cell>
                    <DataTable.Cell numeric>{needs.nutrition.carbs}g</DataTable.Cell>
                    <DataTable.Cell></DataTable.Cell>
                  </DataTable.Row>
                  
                  <DataTable.Row>
                    <DataTable.Cell>Hydration</DataTable.Cell>
                    <DataTable.Cell numeric>{needs.hydration.volume}ml</DataTable.Cell>
                    <DataTable.Cell>
                      <ProgressBar 
                        progress={coverage.hydration} 
                        color={coverage.hydration < 0.7 ? theme.colors.error : theme.colors.primary}
                        style={styles.progressBar}
                      />
                    </DataTable.Cell>
                  </DataTable.Row>
                  
                  <DataTable.Row>
                    <DataTable.Cell>Carried Weight</DataTable.Cell>
                    <DataTable.Cell numeric>{carriedWeight.toFixed(2)}kg</DataTable.Cell>
                    <DataTable.Cell></DataTable.Cell>
                  </DataTable.Row>
                </DataTable>
                
                {(coverage.nutrition < 0.7 || coverage.hydration < 0.7) && (
                  <View style={styles.gapWarning}>
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={20}
                      color={theme.colors.error}
                      style={styles.warningIcon}
                    />
                    <Text style={[styles.warningText, { color: theme.colors.error }]}>
                      Gap detected in your nutrition/hydration coverage
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          
          <Divider style={styles.divider} />
          
          <View style={styles.checklistPreview}>
            <Text style={styles.sectionTitle}>Checklist Items</Text>
            {checklist.length === 0 ? (
              <Text style={styles.emptyText}>No checklist items</Text>
            ) : (
              <View style={styles.checklistItems}>
                {checklist.slice(0, 3).map(item => (
                  <View key={item.id} style={styles.checklistItem}>
                    <MaterialCommunityIcons
                      name={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={theme.colors.primary}
                    />
                    <Text style={styles.checklistText}>{item.text}</Text>
                  </View>
                ))}
                {checklist.length > 3 && (
                  <Text style={styles.moreItems}>
                    +{checklist.length - 3} more items
                  </Text>
                )}
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render checklist modal
  const renderChecklistModal = () => {
    return (
      <Card>
        <Card.Title title={`Checklist for ${selectedAidStation?.name}`} />
        <Card.Content>
          <View style={styles.addItemRow}>
            <TextInput
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="Add new item..."
              mode="outlined"
              style={styles.addItemInput}
            />
            <Button 
              mode="contained"
              onPress={addChecklistItem}
              disabled={!newItemText.trim()}
            >
              Add
            </Button>
          </View>
          
          <ScrollView style={styles.checklistScroll}>
            {checklist.map(item => (
              <View key={item.id} style={styles.checklistModalItem}>
                <Checkbox
                  status={item.checked ? 'checked' : 'unchecked'}
                  onPress={() => toggleChecklistItem(item.id)}
                />
                <Text 
                  style={[
                    styles.checklistModalText,
                    item.checked && styles.checkedText
                  ]}
                >
                  {item.text}
                </Text>
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => removeChecklistItem(item.id)}
                />
              </View>
            ))}
          </ScrollView>
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={saveChecklist}
          >
            Save Checklist
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  // Render arrival time modal
  const renderArrivalModal = () => {
    return (
      <Card>
        <Card.Title title={`Timing for ${selectedAidStation?.name}`} />
        <Card.Content>
          <Text style={styles.modalSubtitle}>
            Set your estimated arrival and departure times
          </Text>
          
          <TextInput
            label="Estimated Arrival Time"
            value={arrivalTime}
            onChangeText={setArrivalTime}
            placeholder="e.g., 2:30 PM"
            mode="outlined"
            style={styles.timeInput}
          />
          
          <TextInput
            label="Estimated Departure Time"
            value={departureTime}
            onChangeText={setDepartureTime}
            placeholder="e.g., 2:45 PM"
            mode="outlined"
            style={styles.timeInput}
          />
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={saveArrivalTimes}
          >
            Save Times
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      {renderAidStationList()}
      {renderAidStationDetails()}
      
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {modalType === 'checklist' ? renderChecklistModal() : renderArrivalModal()}
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
  aidStationList: {
    maxHeight: 200,
  },
  aidStationItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  aidStationInfo: {
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
  aidStationActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  divider: {
    marginVertical: 16,
  },
  timingSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timingItem: {
    flex: 1,
  },
  timingLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  timingValue: {
    fontSize: 16,
  },
  needsSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  gapWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: theme => theme.colors.errorContainer,
    borderRadius: 4,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    flex: 1,
  },
  checklistPreview: {
    marginBottom: 16,
  },
  checklistItems: {
    marginTop: 8,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checklistText: {
    marginLeft: 8,
  },
  moreItems: {
    marginTop: 4,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  modalContainer: {
    padding: 16,
    margin: 16,
  },
  modalSubtitle: {
    marginBottom: 16,
  },
  addItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  addItemInput: {
    flex: 1,
    marginRight: 8,
  },
  checklistScroll: {
    maxHeight: 300,
  },
  checklistModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checklistModalText: {
    flex: 1,
    marginLeft: 8,
  },
  checkedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  timeInput: {
    marginBottom: 16,
  },
});

export default AidStationIntegration;