import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox, Divider, List, useTheme as usePaperTheme, Portal, Modal, IconButton, Chip, FAB, Menu, Dialog } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaces } from '../context/RaceContext';
import { useAppTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [suppliesModalVisible, setSuppliesModalVisible] = useState(false);
  const [newSupplyName, setNewSupplyName] = useState('');
  const [addSupplyDialogVisible, setAddSupplyDialogVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeStationIndex, setActiveStationIndex] = useState(null);
  const [dropBags, setDropBags] = useState([]);
  
  // Load drop bags from AsyncStorage
  useEffect(() => {
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
    
    loadDropBags();
  }, []);
  
  useEffect(() => {
    // Initialize aid stations based on the number specified
    // If race already has aid stations, use those, otherwise create new ones
    if (raceData.aidStations && raceData.aidStations.length > 0) {
      // If we're adding to existing aid stations, don't overwrite them
      // Ensure all aid stations have the new fields
      const updatedStations = raceData.aidStations.map((station, index) => ({
        ...station,
        number: station.number || index + 1,
        washroomAvailable: station.washroomAvailable || false,
        cutoffTimeSpecific: station.cutoffTimeSpecific || '',
        supplies: {
          ...station.supplies,
          energy_gels: station.supplies?.energy_gels || false,
          electrolyte_tablets: station.supplies?.electrolyte_tablets || false,
          hot_food: station.supplies?.hot_food || false,
          snacks: station.supplies?.snacks || false,
          coffee: station.supplies?.coffee || false,
          tea: station.supplies?.tea || false,
          ...(station.supplies?.custom || {})
        }
      }));
      setAidStations(updatedStations);
    } else {
      // Create new aid stations based on the number specified
      const initialAidStations = Array(raceData.numAidStations || 1).fill().map((_, index) => ({
        id: Date.now().toString() + index,
        number: index + 1,
        name: `Aid Station ${index + 1}`,
        distance: '',
        distanceUnit: raceData.distanceUnit || settings.distanceUnit,
        cutoffTime: '',
        cutoffTimeSpecific: '',
        supplies: {
          water: true,
          sports_drink: true,
          soda: false,
          fruit: false,
          sandwiches: false,
          soup: false,
          medical: true,
          energy_gels: false,
          electrolyte_tablets: false,
          hot_food: false,
          snacks: false,
          coffee: false,
          tea: false,
        },
        dropBagAllowed: raceData.dropBagsAllowed,
        crewAllowed: raceData.crewAllowed,
        washroomAvailable: false,
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
  
  // Function to add a new aid station
  const addAidStation = () => {
    const newStation = {
      id: Date.now().toString(),
      number: aidStations.length + 1,
      name: `Aid Station ${aidStations.length + 1}`,
      distance: '',
      distanceUnit: raceData.distanceUnit || settings.distanceUnit,
      cutoffTime: '',
      cutoffTimeSpecific: '',
      supplies: {
        water: true,
        sports_drink: true,
        soda: false,
        fruit: false,
        sandwiches: false,
        soup: false,
        medical: true,
        energy_gels: false,
        electrolyte_tablets: false,
        hot_food: false,
        snacks: false,
        coffee: false,
        tea: false,
      },
      dropBagAllowed: raceData.dropBagsAllowed,
      crewAllowed: raceData.crewAllowed,
      washroomAvailable: false,
      requiredEquipment: [],
    };
    
    setAidStations([...aidStations, newStation]);
  };
  
  // Function to remove an aid station
  const removeAidStation = (index) => {
    Alert.alert(
      'Remove Aid Station',
      `Are you sure you want to remove ${aidStations[index].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const updatedStations = [...aidStations];
            updatedStations.splice(index, 1);
            
            // Update station numbers
            const renumberedStations = updatedStations.map((station, idx) => ({
              ...station,
              number: idx + 1
            }));
            
            setAidStations(renumberedStations);
            setMenuVisible(false);
          }
        }
      ]
    );
  };
  
  // Function to move an aid station up in the order
  const moveStationUp = (index) => {
    if (index === 0) return;
    
    const updatedStations = [...aidStations];
    const temp = updatedStations[index];
    updatedStations[index] = updatedStations[index - 1];
    updatedStations[index - 1] = temp;
    
    // Update station numbers
    const renumberedStations = updatedStations.map((station, idx) => ({
      ...station,
      number: idx + 1
    }));
    
    setAidStations(renumberedStations);
    setMenuVisible(false);
  };
  
  // Function to move an aid station down in the order
  const moveStationDown = (index) => {
    if (index === aidStations.length - 1) return;
    
    const updatedStations = [...aidStations];
    const temp = updatedStations[index];
    updatedStations[index] = updatedStations[index + 1];
    updatedStations[index + 1] = temp;
    
    // Update station numbers
    const renumberedStations = updatedStations.map((station, idx) => ({
      ...station,
      number: idx + 1
    }));
    
    setAidStations(renumberedStations);
    setMenuVisible(false);
  };
  
  // Function to add a custom supply
  const addCustomSupply = () => {
    if (!newSupplyName.trim()) {
      Alert.alert('Error', 'Please enter a supply name');
      return;
    }
    
    // Format the supply name as a key (lowercase, underscores)
    const supplyKey = newSupplyName.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Update all aid stations with the new supply (default to false)
    const updatedStations = aidStations.map(station => ({
      ...station,
      supplies: {
        ...station.supplies,
        [supplyKey]: false
      }
    }));
    
    setAidStations(updatedStations);
    setNewSupplyName('');
    setAddSupplyDialogVisible(false);
  };
  
  // Function to calculate cutoff time based on specific time or duration
  const calculateCutoffTime = (index, field, value) => {
    const station = aidStations[index];
    const updatedStations = [...aidStations];
    
    if (field === 'cutoffTime') {
      // User entered a duration (e.g., "7:00")
      updatedStations[index].cutoffTime = value;
      
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
          
          updatedStations[index].cutoffTimeSpecific = formattedTime;
        } catch (error) {
          console.log('Error calculating specific time:', error);
        }
      }
    } else if (field === 'cutoffTimeSpecific') {
      // User entered a specific time (e.g., "1:30pm")
      updatedStations[index].cutoffTimeSpecific = value;
      
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
          
          updatedStations[index].cutoffTime = formattedDuration;
        } catch (error) {
          console.log('Error calculating duration:', error);
        }
      }
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
      numAidStations: aidStations.length,
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
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.3 : 0.1,
      shadowRadius: 4,
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

  return (
    <Portal.Host>
      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80 // Extra padding for FAB
        }}
      >
        <View style={styles.content}>
          <Text style={dynamicStyles.title}>Aid Station Setup</Text>
          <Text style={dynamicStyles.subtitle}>
            {raceData.name} - {raceData.distance} {raceData.distanceUnit || 'miles'}
          </Text>
          
          {aidStations.map((station, index) => (
            <Card key={station.id} style={[dynamicStyles.stationCard, { borderLeftWidth: 4, borderLeftColor: theme.colors.primary }]}>
              <Card.Content>
                <View style={styles.stationHeader}>
                  <View style={styles.stationNumberContainer}>
                    <Text style={[dynamicStyles.stationNumber, { backgroundColor: theme.colors.primary }]}>
                      {station.number}
                    </Text>
                  </View>
                  
                  <View style={styles.stationTitleContainer}>
                    <TextInput
                      label="Aid Station Name (optional)"
                      value={station.name}
                      onChangeText={(value) => updateAidStation(index, 'name', value)}
                      style={[dynamicStyles.input, { flex: 1 }]}
                      mode="outlined"
                      theme={paperTheme}
                    />
                  </View>
                  
                  <IconButton
                    icon="dots-vertical"
                    size={24}
                    color={isDarkMode ? theme.colors.text : '#000000'}
                    onPress={() => {
                      setActiveStationIndex(index);
                      setMenuVisible(true);
                    }}
                  />
                </View>
                
                <Menu
                  visible={menuVisible && activeStationIndex === index}
                  onDismiss={() => setMenuVisible(false)}
                  anchor={{ x: 0, y: 0 }}
                  style={{ marginTop: 50, marginLeft: 250 }}
                >
                  <Menu.Item 
                    onPress={() => moveStationUp(index)} 
                    title="Move Up" 
                    disabled={index === 0}
                    icon="arrow-up"
                  />
                  <Menu.Item 
                    onPress={() => moveStationDown(index)} 
                    title="Move Down" 
                    disabled={index === aidStations.length - 1}
                    icon="arrow-down"
                  />
                  <Divider />
                  <Menu.Item 
                    onPress={() => removeAidStation(index)} 
                    title="Remove" 
                    icon="delete"
                    titleStyle={{ color: 'red' }}
                  />
                </Menu>
                
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
                </View>
                
                <View style={styles.rowInputs}>
                  <TextInput
                    label="Cut-off Time (hh:mm)"
                    value={station.cutoffTime}
                    onChangeText={(value) => calculateCutoffTime(index, 'cutoffTime', value)}
                    style={[dynamicStyles.input, styles.halfInput]}
                    mode="outlined"
                    theme={paperTheme}
                  />
                  
                  <TextInput
                    label="Specific Time (e.g. 1:30pm)"
                    value={station.cutoffTimeSpecific}
                    onChangeText={(value) => calculateCutoffTime(index, 'cutoffTimeSpecific', value)}
                    style={[dynamicStyles.input, styles.halfInput]}
                    mode="outlined"
                    theme={paperTheme}
                  />
                </View>
                
                <View style={styles.sectionHeader}>
                  <Text style={dynamicStyles.sectionLabel}>Available Supplies:</Text>
                  <Button 
                    mode="outlined" 
                    onPress={() => {
                      setSelectedStationIndex(index);
                      setSuppliesModalVisible(true);
                    }}
                    style={styles.equipmentButton}
                    icon="pencil"
                  >
                    Edit
                  </Button>
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
                        onPress={() => openEquipmentModal(index)}
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
                        onPress={() => updateAidStation(index, 'dropBagAllowed', !station.dropBagAllowed)}
                        style={styles.featureCheckbox}
                      />
                      
                      {station.dropBagAllowed && station.assignedDropBag && (
                        <View style={styles.assignedDropBag}>
                          <Text style={[styles.assignedDropBagText, { color: isDarkMode ? theme.colors.text : '#000000' }]}>
                            Assigned Drop Bag: {station.assignedDropBag.name}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  {raceData.crewAllowed && (
                    <Checkbox.Item
                      label="Crew Access Allowed"
                      status={station.crewAllowed ? 'checked' : 'unchecked'}
                      onPress={() => updateAidStation(index, 'crewAllowed', !station.crewAllowed)}
                      style={styles.featureCheckbox}
                    />
                  )}
                  
                  <Checkbox.Item
                    label="Washroom Available"
                    status={station.washroomAvailable ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(index, 'washroomAvailable', !station.washroomAvailable)}
                    style={styles.featureCheckbox}
                  />
                </View>
              </Card.Content>
            </Card>
          ))}
          
          <Button
            mode="contained"
            onPress={addAidStation}
            style={[styles.addButton, { backgroundColor: theme.colors.secondary }]}
            icon="plus"
          >
            Add Aid Station
          </Button>
          
          <Button
            mode="contained"
            onPress={handleSaveRacePlan}
            style={[styles.button, { marginTop: 16 }]}
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
            {selectedStationIndex !== null && (
              <>
                <View style={styles.supplyCategory}>
                  <Text style={dynamicStyles.supplyCategoryTitle}>Hydration</Text>
                  <Checkbox.Item
                    label="Water"
                    status={aidStations[selectedStationIndex].supplies.water ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.water', !aidStations[selectedStationIndex].supplies.water)}
                  />
                  <Checkbox.Item
                    label="Sports Drink"
                    status={aidStations[selectedStationIndex].supplies.sports_drink ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.sports_drink', !aidStations[selectedStationIndex].supplies.sports_drink)}
                  />
                  <Checkbox.Item
                    label="Soda"
                    status={aidStations[selectedStationIndex].supplies.soda ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.soda', !aidStations[selectedStationIndex].supplies.soda)}
                  />
                  <Checkbox.Item
                    label="Coffee"
                    status={aidStations[selectedStationIndex].supplies.coffee ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.coffee', !aidStations[selectedStationIndex].supplies.coffee)}
                  />
                  <Checkbox.Item
                    label="Tea"
                    status={aidStations[selectedStationIndex].supplies.tea ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.tea', !aidStations[selectedStationIndex].supplies.tea)}
                  />
                </View>
                
                <Divider style={dynamicStyles.divider} />
                
                <View style={styles.supplyCategory}>
                  <Text style={dynamicStyles.supplyCategoryTitle}>Nutrition</Text>
                  <Checkbox.Item
                    label="Fruit"
                    status={aidStations[selectedStationIndex].supplies.fruit ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.fruit', !aidStations[selectedStationIndex].supplies.fruit)}
                  />
                  <Checkbox.Item
                    label="Sandwiches"
                    status={aidStations[selectedStationIndex].supplies.sandwiches ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.sandwiches', !aidStations[selectedStationIndex].supplies.sandwiches)}
                  />
                  <Checkbox.Item
                    label="Soup"
                    status={aidStations[selectedStationIndex].supplies.soup ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.soup', !aidStations[selectedStationIndex].supplies.soup)}
                  />
                  <Checkbox.Item
                    label="Energy Gels"
                    status={aidStations[selectedStationIndex].supplies.energy_gels ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.energy_gels', !aidStations[selectedStationIndex].supplies.energy_gels)}
                  />
                  <Checkbox.Item
                    label="Electrolyte Tablets"
                    status={aidStations[selectedStationIndex].supplies.electrolyte_tablets ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.electrolyte_tablets', !aidStations[selectedStationIndex].supplies.electrolyte_tablets)}
                  />
                  <Checkbox.Item
                    label="Hot Food"
                    status={aidStations[selectedStationIndex].supplies.hot_food ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.hot_food', !aidStations[selectedStationIndex].supplies.hot_food)}
                  />
                  <Checkbox.Item
                    label="Snacks"
                    status={aidStations[selectedStationIndex].supplies.snacks ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.snacks', !aidStations[selectedStationIndex].supplies.snacks)}
                  />
                </View>
                
                <Divider style={dynamicStyles.divider} />
                
                <View style={styles.supplyCategory}>
                  <Text style={dynamicStyles.supplyCategoryTitle}>Support</Text>
                  <Checkbox.Item
                    label="Medical Support"
                    status={aidStations[selectedStationIndex].supplies.medical ? 'checked' : 'unchecked'}
                    onPress={() => updateAidStation(selectedStationIndex, 'supplies.medical', !aidStations[selectedStationIndex].supplies.medical)}
                  />
                </View>
                
                {/* Custom supplies */}
                {Object.entries(aidStations[selectedStationIndex].supplies)
                  .filter(([key]) => !['water', 'sports_drink', 'soda', 'fruit', 'sandwiches', 'soup', 'medical', 
                                      'energy_gels', 'electrolyte_tablets', 'hot_food', 'snacks', 'coffee', 'tea'].includes(key))
                  .length > 0 && (
                  <>
                    <Divider style={dynamicStyles.divider} />
                    <View style={styles.supplyCategory}>
                      <Text style={dynamicStyles.supplyCategoryTitle}>Custom Supplies</Text>
                      {Object.entries(aidStations[selectedStationIndex].supplies)
                        .filter(([key]) => !['water', 'sports_drink', 'soda', 'fruit', 'sandwiches', 'soup', 'medical', 
                                            'energy_gels', 'electrolyte_tablets', 'hot_food', 'snacks', 'coffee', 'tea'].includes(key))
                        .map(([key, value]) => (
                          <Checkbox.Item
                            key={key}
                            label={key.replace(/_/g, ' ')}
                            status={value ? 'checked' : 'unchecked'}
                            onPress={() => updateAidStation(selectedStationIndex, `supplies.${key}`, !value)}
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
        onPress={handleSaveRacePlan}
      />
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
    elevation: 2,
  },
  addButton: {
    marginTop: 8,
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
  assignedDropBag: {
    marginLeft: 32,
    marginTop: 4,
    marginBottom: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  assignedDropBagText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default AidStationSetupScreen;