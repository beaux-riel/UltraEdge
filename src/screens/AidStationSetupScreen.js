import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox, Divider, List, useTheme as usePaperTheme, Portal, Modal, IconButton, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaces } from '../context/RaceContext';
import { useAppTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

const AidStationSetupScreen = ({ route, navigation }) => {
  const { raceData } = route.params;
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { updateRace } = useRaces();
  const { settings } = useSettings();
  
  const [aidStations, setAidStations] = useState([]);
  const [selectedStationIndex, setSelectedStationIndex] = useState(null);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  
  useEffect(() => {
    // Initialize aid stations based on the number specified
    // If race already has aid stations, use those, otherwise create new ones
    if (raceData.aidStations && raceData.aidStations.length > 0) {
      // If we're adding to existing aid stations, don't overwrite them
      setAidStations(raceData.aidStations);
    } else {
      // Create new aid stations based on the number specified
      const initialAidStations = Array(raceData.numAidStations).fill().map((_, index) => ({
        id: Date.now().toString() + index,
        name: `Aid Station ${index + 1}`,
        distance: '',
        distanceUnit: raceData.distanceUnit || settings.distanceUnit,
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
    navigation.navigate('RaceDetails', { id: completePlan.id });
  };
  
  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? theme.colors.background : '#f5f5f5',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    subtitle: {
      fontSize: 16,
      marginBottom: 24,
      textAlign: 'center',
      opacity: 0.7,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    stationCard: {
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
    },
    input: {
      marginBottom: 12,
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 8,
      marginBottom: 4,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    divider: {
      marginVertical: 12,
      backgroundColor: isDarkMode ? theme.colors.border : '#e0e0e0',
    },
    emptyText: {
      fontStyle: 'italic',
      opacity: 0.7,
      marginVertical: 8,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    modalContainer: {
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
      padding: 20,
      margin: 20,
      borderRadius: 8,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    modalSubtitle: {
      marginBottom: 16,
      opacity: 0.7,
      color: isDarkMode ? theme.colors.text : '#000000',
    },
  };

  return (
    <Portal.Host>
      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 16
        }}
      >
        <View style={styles.content}>
          <Text style={dynamicStyles.title}>Aid Station Setup</Text>
          <Text style={dynamicStyles.subtitle}>
            {raceData.name} - {raceData.distance} {raceData.distanceUnit || 'miles'}
          </Text>
          
          {aidStations.map((station, index) => (
            <Card key={station.id} style={dynamicStyles.stationCard}>
              <Card.Content>
                <TextInput
                  label="Aid Station Name"
                  value={station.name}
                  onChangeText={(value) => updateAidStation(index, 'name', value)}
                  style={dynamicStyles.input}
                  mode="outlined"
                  theme={paperTheme}
                />
                
                <View style={styles.rowInputs}>
                  <TextInput
                    label={`Distance (${station.distanceUnit || 'miles'})`}
                    value={station.distance}
                    onChangeText={(value) => updateAidStation(index, 'distance', value)}
                    style={[dynamicStyles.input, styles.halfInput]}
                    keyboardType="numeric"
                    mode="outlined"
                    theme={paperTheme}
                  />
                  
                  <TextInput
                    label="Cut-off Time (hh:mm)"
                    value={station.cutoffTime}
                    onChangeText={(value) => updateAidStation(index, 'cutoffTime', value)}
                    style={[dynamicStyles.input, styles.halfInput]}
                    mode="outlined"
                    theme={paperTheme}
                  />
                </View>
                
                <Text style={dynamicStyles.sectionLabel}>Available Supplies:</Text>
                
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
                
                <Divider style={dynamicStyles.divider} />
                
                {raceData.mandatoryEquipment && raceData.mandatoryEquipment.length > 0 && (
                  <View style={styles.equipmentSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={dynamicStyles.sectionLabel}>Required Equipment Check:</Text>
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
                      <Text style={dynamicStyles.emptyText}>No equipment checks at this station.</Text>
                    )}
                    
                    <Divider style={dynamicStyles.divider} />
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
          contentContainerStyle={dynamicStyles.modalContainer}
        >
          <Text style={dynamicStyles.modalTitle}>Required Equipment Check</Text>
          <Text style={dynamicStyles.modalSubtitle}>
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