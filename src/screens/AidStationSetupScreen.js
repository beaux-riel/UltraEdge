import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox, Divider, List, useTheme, Portal, Modal, IconButton, Chip } from 'react-native-paper';
import { useRaces } from '../context/RaceContext';

const AidStationSetupScreen = ({ route, navigation }) => {
  const { raceData } = route.params;
  const theme = useTheme();
  const { updateRace } = useRaces();
  
  const [aidStations, setAidStations] = useState([]);
  const [selectedStationIndex, setSelectedStationIndex] = useState(null);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  
  useEffect(() => {
    // Initialize aid stations based on the number specified
    // If race already has aid stations, use those, otherwise create new ones
    if (raceData.aidStations && raceData.aidStations.length > 0) {
      setAidStations(raceData.aidStations);
    } else {
      const initialAidStations = Array(raceData.numAidStations).fill().map((_, index) => ({
        id: index.toString(),
        name: `Aid Station ${index + 1}`,
        distance: '',
        distanceUnit: raceData.distanceUnit || 'miles',
        cutoffTime: '',
        supplies: {
          water: true,
          sports_drink: true,
          soda: false,
          fruit: false,
          sandwiches: false,
          soup: false,
          medical: true,
        },
        dropBagAllowed: raceData.dropBagsAllowed,
        crewAllowed: raceData.crewAllowed,
        requiredEquipment: [],
      }));
      
      setAidStations(initialAidStations);
    }
  }, [raceData]);
  
  const updateAidStation = (index, field, value) => {
    const updatedStations = [...aidStations];
    
    if (field.includes('.')) {
      // Handle nested properties like supplies.water
      const [parent, child] = field.split('.');
      updatedStations[index][parent][child] = value;
    } else {
      updatedStations[index][field] = value;
    }
    
    setAidStations(updatedStations);
  };
  
  const openEquipmentModal = (index) => {
    setSelectedStationIndex(index);
    setEquipmentModalVisible(true);
  };
  
  const toggleEquipmentItem = (equipmentItem) => {
    if (selectedStationIndex === null) return;
    
    const updatedStations = [...aidStations];
    const station = updatedStations[selectedStationIndex];
    
    if (!station.requiredEquipment) {
      station.requiredEquipment = [];
    }
    
    const itemIndex = station.requiredEquipment.indexOf(equipmentItem);
    
    if (itemIndex === -1) {
      // Add item
      station.requiredEquipment.push(equipmentItem);
    } else {
      // Remove item
      station.requiredEquipment.splice(itemIndex, 1);
    }
    
    setAidStations(updatedStations);
  };
  
  const handleSaveRacePlan = () => {
    // Validate that all aid stations have distances
    const isValid = aidStations.every(station => station.distance.trim() !== '');
    
    if (!isValid) {
      Alert.alert('Missing Information', 'Please enter distances for all aid stations.');
      return;
    }
    
    // Save the complete race plan to storage
    const completePlan = {
      ...raceData,
      aidStations,
    };
    
    // Update the race in our context
    updateRace(raceData.id, completePlan);
    
    // Navigate to the race details screen
    navigation.navigate('RaceDetails', { id: completePlan.id, isNew: true });
  };
  
  return (
    <Portal.Host>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Aid Station Setup</Text>
          <Text style={styles.subtitle}>
            {raceData.name} - {raceData.distance} {raceData.distanceUnit || 'miles'}
          </Text>
          
          {aidStations.map((station, index) => (
            <Card key={station.id} style={styles.stationCard}>
              <Card.Content>
                <TextInput
                  label="Aid Station Name"
                  value={station.name}
                  onChangeText={(value) => updateAidStation(index, 'name', value)}
                  style={styles.input}
                  mode="outlined"
                />
                
                <View style={styles.rowInputs}>
                  <TextInput
                    label={`Distance (${station.distanceUnit || 'miles'})`}
                    value={station.distance}
                    onChangeText={(value) => updateAidStation(index, 'distance', value)}
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  
                  <TextInput
                    label="Cut-off Time (hh:mm)"
                    value={station.cutoffTime}
                    onChangeText={(value) => updateAidStation(index, 'cutoffTime', value)}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                  />
                </View>
                
                <Text style={styles.sectionLabel}>Available Supplies:</Text>
                
                <View style={styles.checkboxRow}>
                  <Checkbox.Item
                    label="Water"
                    status={station.supplies.water ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'supplies.water', !station.supplies.water)}
                    style={styles.checkbox}
                  />
                  
                  <Checkbox.Item
                    label="Sports Drink"
                    status={station.supplies.sports_drink ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'supplies.sports_drink', !station.supplies.sports_drink)}
                    style={styles.checkbox}
                  />
                </View>
                
                <View style={styles.checkboxRow}>
                  <Checkbox.Item
                    label="Soda"
                    status={station.supplies.soda ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'supplies.soda', !station.supplies.soda)}
                    style={styles.checkbox}
                  />
                  
                  <Checkbox.Item
                    label="Fruit"
                    status={station.supplies.fruit ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'supplies.fruit', !station.supplies.fruit)}
                    style={styles.checkbox}
                  />
                </View>
                
                <View style={styles.checkboxRow}>
                  <Checkbox.Item
                    label="Sandwiches"
                    status={station.supplies.sandwiches ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'supplies.sandwiches', !station.supplies.sandwiches)}
                    style={styles.checkbox}
                  />
                  
                  <Checkbox.Item
                    label="Soup"
                    status={station.supplies.soup ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'supplies.soup', !station.supplies.soup)}
                    style={styles.checkbox}
                  />
                </View>
                
                <Checkbox.Item
                  label="Medical Support"
                  status={station.supplies.medical ? 'checked' : 'unchecked'}
                  onPress={() => updateAidStation(index, 'supplies.medical', !station.supplies.medical)}
                />
                
                <Divider style={styles.divider} />
                
                {raceData.mandatoryEquipment && raceData.mandatoryEquipment.length > 0 && (
                  <View style={styles.equipmentSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionLabel}>Required Equipment Check:</Text>
                      <Button 
                        mode="outlined" 
                        onPress={() => openEquipmentModal(index)}
                        style={styles.equipmentButton}
                      >
                        Edit
                      </Button>
                    </View>
                    
                    {station.requiredEquipment && station.requiredEquipment.length > 0 ? (
                      <View style={styles.chipContainer}>
                        {station.requiredEquipment.map((item, i) => (
                          <Chip 
                            key={i} 
                            style={styles.chip}
                            icon="check"
                          >
                            {item}
                          </Chip>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.emptyText}>No equipment checks at this station.</Text>
                    )}
                    
                    <Divider style={styles.divider} />
                  </View>
                )}
                
                {raceData.dropBagsAllowed && (
                  <Checkbox.Item
                    label="Drop Bags Allowed"
                    status={station.dropBagAllowed ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'dropBagAllowed', !station.dropBagAllowed)}
                  />
                )}
                
                {raceData.crewAllowed && (
                  <Checkbox.Item
                    label="Crew Access Allowed"
                    status={station.crewAllowed ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'crewAllowed', !station.crewAllowed)}
                  />
                )}
              </Card.Content>
            </Card>
          ))}
          
          <Button
            mode="contained"
            onPress={handleSaveRacePlan}
            style={styles.button}
          >
            Save Race Plan
          </Button>
        </View>
      </ScrollView>
      
      <Portal>
        <Modal
          visible={equipmentModalVisible}
          onDismiss={() => setEquipmentModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Required Equipment Check</Text>
          <Text style={styles.modalSubtitle}>
            Select equipment that must be checked at this aid station:
          </Text>
          
          <ScrollView style={styles.modalScroll}>
            {raceData.mandatoryEquipment && raceData.mandatoryEquipment.map((item, index) => {
              const isSelected = selectedStationIndex !== null && 
                aidStations[selectedStationIndex].requiredEquipment && 
                aidStations[selectedStationIndex].requiredEquipment.includes(item);
              
              return (
                <Checkbox.Item
                  key={index}
                  label={item}
                  status={isSelected ? 'checked' : 'unchecked'}
                  onPress={() => toggleEquipmentItem(item)}
                />
              );
            })}
          </ScrollView>
          
          <Button 
            mode="contained" 
            onPress={() => setEquipmentModalVisible(false)}
            style={styles.modalButton}
          >
            Done
          </Button>
        </Modal>
      </Portal>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  stationCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkbox: {
    flex: 1,
  },
  divider: {
    marginVertical: 12,
  },
  button: {
    marginTop: 16,
    marginBottom: 32,
    paddingVertical: 8,
  },
  equipmentSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  equipmentButton: {
    borderRadius: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    margin: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    opacity: 0.7,
    marginVertical: 8,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    marginBottom: 16,
    opacity: 0.7,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default AidStationSetupScreen;