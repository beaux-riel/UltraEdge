import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox, Divider, List, useTheme as usePaperTheme, Portal, Modal, IconButton, Chip, FAB, Dialog, Menu } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaces } from '../context/RaceContext';
import { useAppTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EditAidStationScreen = ({ route, navigation }) => {
  const { raceId, stationIndex } = route.params;
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { getRaceById, updateRace } = useRaces();
  const { settings } = useSettings();
  
  const raceData = getRaceById(raceId) || {};
  const [station, setStation] = useState(null);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [suppliesModalVisible, setSuppliesModalVisible] = useState(false);
  const [newSupplyName, setNewSupplyName] = useState('');
  const [addSupplyDialogVisible, setAddSupplyDialogVisible] = useState(false);
  const [dropBags, setDropBags] = useState([]);
  const [dropBagMenuVisible, setDropBagMenuVisible] = useState(false);
  
  // Load drop bags from AsyncStorage
  const loadDropBags = async () => {
    try {
      const storedDropBags = await AsyncStorage.getItem('dropBags');
      if (storedDropBags) {
        setDropBags(JSON.parse(storedDropBags));
      }
    } catch (error) {
      console.error('Error loading drop bags:', error);
    }
  };

  useEffect(() => {
    if (raceData.aidStations && raceData.aidStations[stationIndex]) {
      // Ensure the station has all the required fields
      const updatedStation = {
        ...raceData.aidStations[stationIndex],
        number: raceData.aidStations[stationIndex].number || stationIndex + 1,
        washroomAvailable: raceData.aidStations[stationIndex].washroomAvailable || false,
        cutoffTimeSpecific: raceData.aidStations[stationIndex].cutoffTimeSpecific || '',
        supplies: {
          ...raceData.aidStations[stationIndex].supplies,
          energy_gels: raceData.aidStations[stationIndex].supplies?.energy_gels || false,
          electrolyte_tablets: raceData.aidStations[stationIndex].supplies?.electrolyte_tablets || false,
          hot_food: raceData.aidStations[stationIndex].supplies?.hot_food || false,
          snacks: raceData.aidStations[stationIndex].supplies?.snacks || false,
          coffee: raceData.aidStations[stationIndex].supplies?.coffee || false,
          tea: raceData.aidStations[stationIndex].supplies?.tea || false,
        },
        assignedDropBag: raceData.aidStations[stationIndex].assignedDropBag || null
      };
      setStation(updatedStation);
      
      // Load drop bags
      loadDropBags();
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
  
  // Function to add a custom supply
  const addCustomSupply = () => {
    if (!newSupplyName.trim()) {
      Alert.alert('Error', 'Please enter a supply name');
      return;
    }
    
    // Format the supply name as a key (lowercase, underscores)
    const supplyKey = newSupplyName.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Update the station with the new supply (default to false)
    setStation(prevStation => ({
      ...prevStation,
      supplies: {
        ...prevStation.supplies,
        [supplyKey]: false
      }
    }));
    
    setNewSupplyName('');
    setAddSupplyDialogVisible(false);
  };
  
  // Function to calculate cutoff time based on specific time or duration
  const calculateCutoffTime = (field, value) => {
    if (!station) return;
    
    const updatedStation = {...station};
    
    if (field === 'cutoffTime') {
      // User entered a duration (e.g., "7:00")
      updatedStation.cutoffTime = value;
      
      // Calculate specific time if race start time is available
      if (raceData.startTime) {
        try {
          const [hours, minutes] = value.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes;
          
          const startTime = new Date(`2000-01-01T${raceData.startTime}`);
          const cutoffTime = new Date(startTime.getTime() + totalMinutes * 60000);
          
          const formattedTime = cutoffTime.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          updatedStation.cutoffTimeSpecific = formattedTime;
        } catch (error) {
          console.log('Error calculating specific time:', error);
        }
      }
    } else if (field === 'cutoffTimeSpecific') {
      // User entered a specific time (e.g., "1:30pm")
      updatedStation.cutoffTimeSpecific = value;
      
      // Calculate duration if race start time is available
      if (raceData.startTime) {
        try {
          // Parse the specific time
          let specificTime;
          if (value.toLowerCase().includes('am') || value.toLowerCase().includes('pm')) {
            // Convert 12-hour format to 24-hour
            const timeStr = value.toLowerCase();
            const isPM = timeStr.includes('pm');
            let [hours, minutesStr] = timeStr.replace(/[ap]m/i, '').split(':');
            hours = parseInt(hours);
            const minutes = parseInt(minutesStr);
            
            if (isPM && hours < 12) hours += 12;
            if (!isPM && hours === 12) hours = 0;
            
            specificTime = new Date();
            specificTime.setHours(hours, minutes, 0);
          } else {
            // Assume 24-hour format
            const [hours, minutes] = value.split(':').map(Number);
            specificTime = new Date();
            specificTime.setHours(hours, minutes, 0);
          }
          
          // Parse the start time
          const startTime = new Date(`2000-01-01T${raceData.startTime}`);
          
          // Calculate the difference in minutes
          const diffMinutes = (specificTime - startTime) / 60000;
          
          // Format as hours:minutes
          const hours = Math.floor(diffMinutes / 60);
          const minutes = Math.floor(diffMinutes % 60);
          const formattedDuration = `${hours}:${minutes.toString().padStart(2, '0')}`;
          
          updatedStation.cutoffTime = formattedDuration;
        } catch (error) {
          console.log('Error calculating duration:', error);
        }
      }
    }
    
    setStation(updatedStation);
  };
  
  const handleSaveStation = () => {
    // Validate that the station has a name and distance
    if (!station.distance.trim()) {
      Alert.alert('Missing Information', 'Please enter a distance for the aid station.');
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
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
    },
    stationNumber: {
      width: 36,
      height: 36,
      borderRadius: 18,
      textAlign: 'center',
      textAlignVertical: 'center',
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 16,
      lineHeight: 36,
      backgroundColor: theme.colors.primary,
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
    supplyCategoryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: theme.colors.primary,
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
          paddingBottom: insets.bottom + 80 // Extra padding for FAB
        }}
      >
        <View style={styles.content}>
          <Text style={dynamicStyles.title}>Edit Aid Station</Text>
          <Text style={dynamicStyles.subtitle}>
            {raceData.name} - {raceData.distance} {raceData.distanceUnit || 'miles'}
          </Text>
          
          <Card style={dynamicStyles.stationCard}>
            <Card.Content>
              <View style={styles.stationHeader}>
                <View style={styles.stationNumberContainer}>
                  <Text style={dynamicStyles.stationNumber}>
                    {station.number}
                  </Text>
                </View>
                
                <View style={styles.stationTitleContainer}>
                  <TextInput
                    label="Aid Station Name (optional)"
                    value={station.name}
                    onChangeText={(value) => updateStationField('name', value)}
                    style={[dynamicStyles.input, { flex: 1 }]}
                    mode="outlined"
                    theme={paperTheme}
                  />
                </View>
              </View>
              
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
              </View>
              
              <View style={styles.rowInputs}>
                <TextInput
                  label="Cut-off Time (hh:mm)"
                  value={station.cutoffTime}
                  onChangeText={(value) => calculateCutoffTime('cutoffTime', value)}
                  style={[dynamicStyles.input, styles.halfInput]}
                  mode="outlined"
                  theme={paperTheme}
                />
                
                <TextInput
                  label="Specific Time (e.g. 1:30pm)"
                  value={station.cutoffTimeSpecific}
                  onChangeText={(value) => calculateCutoffTime('cutoffTimeSpecific', value)}
                  style={[dynamicStyles.input, styles.halfInput]}
                  mode="outlined"
                  theme={paperTheme}
                />
              </View>
              
              <View style={styles.sectionHeader}>
                <Text style={dynamicStyles.sectionLabel}>Available Supplies:</Text>
                <Button 
                  onPress={() => setSuppliesModalVisible(true)}
                  style={styles.equipmentButton}
                  icon="dots-vertical"
                />
              </View>
              
              <View style={styles.suppliesContainer}>
                {Object.entries(station.supplies).map(([key, value]) => 
                  value && (
                    <Chip 
                      key={key} 
                      style={[styles.supplyChip, { backgroundColor: isDarkMode ? '#333333' : '#f0f0f0' }]}
                      textStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                    >
                      {key.replace(/_/g, ' ')}
                    </Chip>
                  )
                )}
              </View>
              
              <Divider style={dynamicStyles.divider} />
              
              {raceData.mandatoryEquipment && raceData.mandatoryEquipment.length > 0 && (
                <View style={styles.equipmentSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={dynamicStyles.sectionLabel}>Required Equipment Check:</Text>
                    <Button 
                      mode="outlined" 
                      onPress={openEquipmentModal}
                      style={styles.equipmentButton}
                      icon="pencil"
                    >
                      Edit
                    </Button>
                  </View>
                  
                  {station.requiredEquipment && station.requiredEquipment.length > 0 ? (
                    <View style={styles.chipContainer}>
                      {station.requiredEquipment.map((item, i) => (
                        <Chip 
                          key={i} 
                          style={[styles.chip, { backgroundColor: isDarkMode ? '#333333' : '#f0f0f0' }]}
                          icon="check"
                          textStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
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
              
              <View style={styles.featuresContainer}>
                {raceData.dropBagsAllowed && (
                  <>
                    <Checkbox.Item
                      label="Drop Bags Allowed"
                      status={station.dropBagAllowed ? 'checked' : 'unchecked'}
                      onPress={() => updateStationField('dropBagAllowed', !station.dropBagAllowed)}
                      style={styles.featureCheckbox}
                    />
                    
                    {station.dropBagAllowed && (
                      <View style={styles.dropBagSelector}>
                        <Text style={[dynamicStyles.sectionLabel, { marginBottom: 8 }]}>
                          Assigned Drop Bag:
                        </Text>
                        
                        <View style={styles.dropBagRow}>
                          <Text style={[styles.selectedDropBag, { color: isDarkMode ? theme.colors.text : '#000000' }]}>
                            {station.assignedDropBag ? station.assignedDropBag.name : 'None selected'}
                          </Text>
                          
                          <Menu
                            visible={dropBagMenuVisible}
                            onDismiss={() => setDropBagMenuVisible(false)}
                            anchor={
                              <Button 
                                mode="outlined"
                                onPress={() => setDropBagMenuVisible(true)}
                                icon="bag-personal"
                                style={{ marginLeft: 8 }}
                              >
                                {station.assignedDropBag ? 'Change' : 'Select'}
                              </Button>
                            }
                          >
                            <Menu.Item 
                              onPress={() => {
                                updateStationField('assignedDropBag', null);
                                setDropBagMenuVisible(false);
                              }} 
                              title="None" 
                            />
                            <Divider />
                            {dropBags.map((bag, index) => (
                              <Menu.Item
                                key={index}
                                onPress={() => {
                                  updateStationField('assignedDropBag', bag);
                                  setDropBagMenuVisible(false);
                                }}
                                title={bag.name}
                              />
                            ))}
                          </Menu>
                        </View>
                        
                        {station.assignedDropBag && (
                          <View style={styles.dropBagDetails}>
                            <Text style={{ color: isDarkMode ? theme.colors.text : '#000000', marginTop: 8 }}>
                              Contents:
                            </Text>
                            <View style={styles.chipContainer}>
                              {station.assignedDropBag.items.map((item, i) => (
                                <Chip 
                                  key={i} 
                                  style={[styles.chip, { backgroundColor: isDarkMode ? '#333333' : '#f0f0f0' }]}
                                  textStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                                >
                                  {item}
                                </Chip>
                              ))}
                            </View>
                            
                            {station.assignedDropBag.gearItems && station.assignedDropBag.gearItems.length > 0 && (
                              <>
                                <Text style={{ color: isDarkMode ? theme.colors.text : '#000000', marginTop: 8 }}>
                                  Gear:
                                </Text>
                                <View style={styles.chipContainer}>
                                  {station.assignedDropBag.gearItems.map((item, i) => (
                                    <Chip 
                                      key={i} 
                                      style={[styles.chip, { backgroundColor: theme.colors.tertiary + '20' }]}
                                      textStyle={{ color: theme.colors.tertiary }}
                                    >
                                      {item.name} {item.weight && `(${item.weight} ${item.weightUnit || 'g'})`}
                                    </Chip>
                                  ))}
                                </View>
                              </>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </>
                )}
                
                {raceData.crewAllowed && (
                  <Checkbox.Item
                    label="Crew Access Allowed"
                    status={station.crewAllowed ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('crewAllowed', !station.crewAllowed)}
                    style={styles.featureCheckbox}
                  />
                )}
                
                <Checkbox.Item
                  label="Washroom Available"
                  status={station.washroomAvailable ? 'checked' : 'unchecked'}
                  onPress={() => updateStationField('washroomAvailable', !station.washroomAvailable)}
                  style={styles.featureCheckbox}
                />
              </View>
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
        
        <Modal
          visible={suppliesModalVisible}
          onDismiss={() => setSuppliesModalVisible(false)}
          contentContainerStyle={dynamicStyles.modalContainer}
        >
          <Text style={dynamicStyles.modalTitle}>Available Supplies</Text>
          <Text style={dynamicStyles.modalSubtitle}>
            Select supplies available at this aid station:
          </Text>
          
          <ScrollView style={styles.modalScroll}>
            {station && (
              <>
                <View style={styles.supplyCategory}>
                  <Text style={dynamicStyles.supplyCategoryTitle}>Hydration</Text>
                  <Checkbox.Item
                    label="Water"
                    status={station.supplies.water ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.water', !station.supplies.water)}
                  />
                  <Checkbox.Item
                    label="Sports Drink"
                    status={station.supplies.sports_drink ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.sports_drink', !station.supplies.sports_drink)}
                  />
                  <Checkbox.Item
                    label="Soda"
                    status={station.supplies.soda ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.soda', !station.supplies.soda)}
                  />
                  <Checkbox.Item
                    label="Coffee"
                    status={station.supplies.coffee ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.coffee', !station.supplies.coffee)}
                  />
                  <Checkbox.Item
                    label="Tea"
                    status={station.supplies.tea ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.tea', !station.supplies.tea)}
                  />
                </View>
                
                <Divider style={dynamicStyles.divider} />
                
                <View style={styles.supplyCategory}>
                  <Text style={dynamicStyles.supplyCategoryTitle}>Nutrition</Text>
                  <Checkbox.Item
                    label="Fruit"
                    status={station.supplies.fruit ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.fruit', !station.supplies.fruit)}
                  />
                  <Checkbox.Item
                    label="Sandwiches"
                    status={station.supplies.sandwiches ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.sandwiches', !station.supplies.sandwiches)}
                  />
                  <Checkbox.Item
                    label="Soup"
                    status={station.supplies.soup ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.soup', !station.supplies.soup)}
                  />
                  <Checkbox.Item
                    label="Energy Gels"
                    status={station.supplies.energy_gels ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.energy_gels', !station.supplies.energy_gels)}
                  />
                  <Checkbox.Item
                    label="Electrolyte Tablets"
                    status={station.supplies.electrolyte_tablets ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.electrolyte_tablets', !station.supplies.electrolyte_tablets)}
                  />
                  <Checkbox.Item
                    label="Hot Food"
                    status={station.supplies.hot_food ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.hot_food', !station.supplies.hot_food)}
                  />
                  <Checkbox.Item
                    label="Snacks"
                    status={station.supplies.snacks ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.snacks', !station.supplies.snacks)}
                  />
                </View>
                
                <Divider style={dynamicStyles.divider} />
                
                <View style={styles.supplyCategory}>
                  <Text style={dynamicStyles.supplyCategoryTitle}>Support</Text>
                  <Checkbox.Item
                    label="Medical Support"
                    status={station.supplies.medical ? 'checked' : 'unchecked'}
                    onPress={() => updateStationField('supplies.medical', !station.supplies.medical)}
                  />
                </View>
                
                {/* Custom supplies */}
                {Object.entries(station.supplies)
                  .filter(([key]) => !['water', 'sports_drink', 'soda', 'fruit', 'sandwiches', 'soup', 'medical', 
                                      'energy_gels', 'electrolyte_tablets', 'hot_food', 'snacks', 'coffee', 'tea'].includes(key))
                  .length > 0 && (
                  <>
                    <Divider style={dynamicStyles.divider} />
                    <View style={styles.supplyCategory}>
                      <Text style={dynamicStyles.supplyCategoryTitle}>Custom Supplies</Text>
                      {Object.entries(station.supplies)
                        .filter(([key]) => !['water', 'sports_drink', 'soda', 'fruit', 'sandwiches', 'soup', 'medical', 
                                            'energy_gels', 'electrolyte_tablets', 'hot_food', 'snacks', 'coffee', 'tea'].includes(key))
                        .map(([key, value]) => (
                          <Checkbox.Item
                            key={key}
                            label={key.replace(/_/g, ' ')}
                            status={value ? 'checked' : 'unchecked'}
                            onPress={() => updateStationField(`supplies.${key}`, !value)}
                          />
                        ))
                      }
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
          
          <View style={styles.modalActions}>
            <Button 
              mode="outlined" 
              onPress={() => setAddSupplyDialogVisible(true)}
              style={styles.addSupplyButton}
              icon="plus"
            >
              Add New Supply
            </Button>
            
            <Button 
              mode="contained" 
              onPress={() => setSuppliesModalVisible(false)}
              style={styles.modalButton}
            >
              Done
            </Button>
          </View>
        </Modal>
        
        <Dialog
          visible={addSupplyDialogVisible}
          onDismiss={() => setAddSupplyDialogVisible(false)}
        >
          <Dialog.Title>Add New Supply</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Supply Name"
              value={newSupplyName}
              onChangeText={setNewSupplyName}
              mode="outlined"
              theme={paperTheme}
              style={{ marginTop: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddSupplyDialogVisible(false)}>Cancel</Button>
            <Button onPress={addCustomSupply}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="content-save"
        label="Save"
        onPress={handleSaveStation}
      />
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stationNumberContainer: {
    marginRight: 12,
  },
  stationTitleContainer: {
    flex: 1,
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    elevation: 2,
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
  supplyChip: {
    margin: 4,
    borderRadius: 16,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalButton: {
    marginTop: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  addSupplyButton: {
    flex: 1,
    marginRight: 8,
  },
  supplyCategory: {
    marginBottom: 8,
  },
  suppliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    marginBottom: 8,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featureCheckbox: {
    borderRadius: 8,
    marginVertical: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dropBagSelector: {
    marginLeft: 32,
    marginTop: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  dropBagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedDropBag: {
    flex: 1,
    fontSize: 16,
  },
  dropBagDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default EditAidStationScreen;