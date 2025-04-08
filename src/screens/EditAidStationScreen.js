import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox, Divider, List, useTheme as usePaperTheme, Portal, Modal, IconButton, Chip } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaces } from '../context/RaceContext';
import { useAppTheme } from '../context/ThemeContext';

const EditAidStationScreen = ({ route, navigation }) => {
  const { raceId, stationIndex } = route.params;
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { getRaceById, updateRace } = useRaces();
  
  const raceData = getRaceById(raceId) || {};
  const [station, setStation] = useState(null);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  
  useEffect(() => {
    if (raceData.aidStations && raceData.aidStations[stationIndex]) {
      setStation({...raceData.aidStations[stationIndex]});
    } else {
      Alert.alert('Error', 'Aid station not found');
      navigation.goBack();
    }
  }, [raceData, stationIndex, navigation]);

  const updateStationField = (field, value) => {
    if (!station) return;
    
    setStation(prevStation => {
      const updatedStation = {...prevStation};
      
      if (field.includes('.')) {
        // Handle nested properties like supplies.water
        const [parent, child] = field.split('.');
        updatedStation[parent] = {
          ...updatedStation[parent],
          [child]: value
        };
      } else {
        updatedStation[field] = value;
      }
      
      return updatedStation;
    });
  };
  
  const openEquipmentModal = () => {
    setEquipmentModalVisible(true);
  };
  
  const toggleEquipmentItem = (equipmentItem) => {
    if (!station) return;
    
    setStation(prevStation => {
      const updatedStation = {...prevStation};
      
      if (!updatedStation.requiredEquipment) {
        updatedStation.requiredEquipment = [];
      }
      
      const itemIndex = updatedStation.requiredEquipment.indexOf(equipmentItem);
      
      if (itemIndex === -1) {
        // Add item
        updatedStation.requiredEquipment.push(equipmentItem);
      } else {
        // Remove item
        updatedStation.requiredEquipment.splice(itemIndex, 1);
      }
      
      return updatedStation;
    });
  };
  
  const handleSaveStation = () => {
    // Validate that the station has a name and distance
    if (!station.name.trim() || !station.distance.trim()) {
      Alert.alert('Missing Information', 'Please enter a name and distance for the aid station.');
      return;
    }
    
    // Update the aid station in the race data
    const updatedAidStations = [...raceData.aidStations];
    updatedAidStations[stationIndex] = station;
    
    // Update the race in our context
    updateRace(raceId, { aidStations: updatedAidStations });
    
    // Navigate back to the race details screen
    navigation.goBack();
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

  if (!station) {
    return (
      <View style={[dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={dynamicStyles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <Portal.Host>
      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 16
        }}
      >
        <View style={styles.content}>
          <Text style={dynamicStyles.title}>Edit Aid Station</Text>
          <Text style={dynamicStyles.subtitle}>
            {raceData.name} - {raceData.distance} {raceData.distanceUnit || 'miles'}
          </Text>
          
          <Card style={dynamicStyles.stationCard}>
            <Card.Content>
              <TextInput
                label="Aid Station Name"
                value={station.name}
                onChangeText={(value) => updateStationField('name', value)}
                style={dynamicStyles.input}
                mode="outlined"
                theme={paperTheme}
              />
              
              <View style={styles.rowInputs}>
                <TextInput
                  label={`Distance (${station.distanceUnit || 'miles'})`}
                  value={station.distance}
                  onChangeText={(value) => updateStationField('distance', value)}
                  style={[dynamicStyles.input, styles.halfInput]}
                  keyboardType="numeric"
                  mode="outlined"
                  theme={paperTheme}
                />
                
                <TextInput
                  label="Cut-off Time (hh:mm)"
                  value={station.cutoffTime}
                  onChangeText={(value) => updateStationField('cutoffTime', value)}
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
                  onPress={() => updateStationField('supplies.water', !station.supplies.water)}
                  style={styles.checkbox}
                />
                
                <Checkbox.Item
                  label="Sports Drink"
                  status={station.supplies.sports_drink ? 'checked' : 'unchecked'}
                  onPress={() => updateStationField('supplies.sports_drink', !station.supplies.sports_drink)}
                  style={styles.checkbox}
                />
              </View>
              
              <View style={styles.checkboxRow}>
                <Checkbox.Item
                  label="Soda"
                  status={station.supplies.soda ? 'checked' : 'unchecked'}
                  onPress={() => updateStationField('supplies.soda', !station.supplies.soda)}
                  style={styles.checkbox}
                />
                
                <Checkbox.Item
                  label="Fruit"
                  status={station.supplies.fruit ? 'checked' : 'unchecked'}
                  onPress={() => updateStationField('supplies.fruit', !station.supplies.fruit)}
                  style={styles.checkbox}
                />
              </View>
              
              <View style={styles.checkboxRow}>
                <Checkbox.Item
                  label="Sandwiches"
                  status={station.supplies.sandwiches ? 'checked' : 'unchecked'}
                  onPress={() => updateStationField('supplies.sandwiches', !station.supplies.sandwiches)}
                  style={styles.checkbox}
                />
                
                <Checkbox.Item
                  label="Soup"
                  status={station.supplies.soup ? 'checked' : 'unchecked'}
                  onPress={() => updateStationField('supplies.soup', !station.supplies.soup)}
                  style={styles.checkbox}
                />
              </View>
              
              <Checkbox.Item
                label="Medical Support"
                status={station.supplies.medical ? 'checked' : 'unchecked'}
                onPress={() => updateStationField('supplies.medical', !station.supplies.medical)}
              />
              
              <Divider style={dynamicStyles.divider} />
              
              {raceData.mandatoryEquipment && raceData.mandatoryEquipment.length > 0 && (
                <View style={styles.equipmentSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={dynamicStyles.sectionLabel}>Required Equipment Check:</Text>
                    <Button 
                      mode="outlined" 
                      onPress={openEquipmentModal}
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
                  onPress={() => updateStationField('dropBagAllowed', !station.dropBagAllowed)}
                />
              )}
              
              {raceData.crewAllowed && (
                <Checkbox.Item
                  label="Crew Access Allowed"
                  status={station.crewAllowed ? 'checked' : 'unchecked'}
                  onPress={() => updateStationField('crewAllowed', !station.crewAllowed)}
                />
              )}
            </Card.Content>
          </Card>
          
          <Button
            mode="contained"
            onPress={handleSaveStation}
            style={styles.button}
          >
            Save Changes
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
              const isSelected = station.requiredEquipment && 
                station.requiredEquipment.includes(item);
              
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
  content: {
    padding: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    width: '48%',
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkbox: {
    flex: 1,
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
  modalScroll: {
    maxHeight: 300,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default EditAidStationScreen;