import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Divider, Switch, HelperText, useTheme, SegmentedButtons, IconButton, Portal, Modal, List } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRaces } from '../context/RaceContext';

const CreateRaceScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addRace, getRaceById, updateRace } = useRaces();
  
  // Check if we're in edit mode
  const { editMode, raceData: existingRaceData } = route.params || {};
  const existingRace = editMode && existingRaceData ? existingRaceData : null;
  
  const [raceName, setRaceName] = useState('');
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('miles');
  const [elevation, setElevation] = useState('');
  const [elevationUnit, setElevationUnit] = useState('ft');
  const [raceDate, setRaceDate] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [numAidStations, setNumAidStations] = useState('');
  const [dropBagsAllowed, setDropBagsAllowed] = useState(false);
  const [crewAllowed, setCrewAllowed] = useState(false);
  
  // Mandatory equipment state
  const [mandatoryEquipment, setMandatoryEquipment] = useState([]);
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [newEquipmentItem, setNewEquipmentItem] = useState('');
  
  // If in edit mode, populate the form with existing data
  useEffect(() => {
    if (existingRace) {
      setRaceName(existingRace.name);
      setDistance(existingRace.distance.toString());
      setDistanceUnit(existingRace.distanceUnit || 'miles');
      setElevation(existingRace.elevation ? existingRace.elevation.toString() : '');
      setElevationUnit(existingRace.elevationUnit || 'ft');
      setRaceDate(existingRace.date);
      
      // Parse date from string if it exists
      if (existingRace.date) {
        const parts = existingRace.date.split('/');
        if (parts.length === 3) {
          const newDate = new Date(parts[2], parts[0] - 1, parts[1]);
          setDate(newDate);
        }
      }
      
      setNumAidStations(existingRace.numAidStations.toString());
      setDropBagsAllowed(existingRace.dropBagsAllowed);
      setCrewAllowed(existingRace.crewAllowed);
      setMandatoryEquipment(existingRace.mandatoryEquipment || []);
    }
  }, [existingRace]);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
    
    // Format date as MM/DD/YYYY
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const year = currentDate.getFullYear();
    setRaceDate(`${month}/${day}/${year}`);
  };

  const addEquipmentItem = () => {
    if (newEquipmentItem.trim()) {
      setMandatoryEquipment([...mandatoryEquipment, newEquipmentItem.trim()]);
      setNewEquipmentItem('');
    }
  };

  const removeEquipmentItem = (index) => {
    const updatedEquipment = [...mandatoryEquipment];
    updatedEquipment.splice(index, 1);
    setMandatoryEquipment(updatedEquipment);
  };

  const handleCreateRace = () => {
    const newRaceData = {
      id: existingRace ? existingRace.id : Date.now().toString(),
      name: raceName,
      distance: parseFloat(distance),
      distanceUnit,
      elevation: elevation ? parseFloat(elevation) : 0,
      elevationUnit,
      date: raceDate,
      numAidStations: parseInt(numAidStations),
      dropBagsAllowed,
      crewAllowed,
      mandatoryEquipment,
    };
    
    if (existingRace) {
      // Update existing race
      updateRace(existingRace.id, newRaceData);
      navigation.navigate('RaceDetails', { id: existingRace.id });
    } else {
      // Create new race
      addRace(newRaceData);
      navigation.navigate('AidStationSetup', { raceData: newRaceData });
    }
  };

  return (
    <Portal.Host>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 16
        }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{existingRace ? 'Edit Race Plan' : 'Create New Race Plan'}</Text>
          
          <TextInput
            label="Race Name"
            value={raceName}
            onChangeText={setRaceName}
            style={styles.input}
            mode="outlined"
          />
          
          <View style={styles.inputRow}>
            <TextInput
              label="Distance"
              value={distance}
              onChangeText={setDistance}
              style={[styles.input, styles.flexInput]}
              keyboardType="numeric"
              mode="outlined"
            />
            <SegmentedButtons
              value={distanceUnit}
              onValueChange={setDistanceUnit}
              buttons={[
                { value: 'miles', label: 'mi' },
                { value: 'km', label: 'km' }
              ]}
              style={styles.segmentedButton}
            />
          </View>
          
          <View style={styles.inputRow}>
            <TextInput
              label="Elevation Gain"
              value={elevation}
              onChangeText={setElevation}
              style={[styles.input, styles.flexInput]}
              keyboardType="numeric"
              mode="outlined"
            />
            <SegmentedButtons
              value={elevationUnit}
              onValueChange={setElevationUnit}
              buttons={[
                { value: 'ft', label: 'ft' },
                { value: 'm', label: 'm' }
              ]}
              style={styles.segmentedButton}
            />
          </View>
          
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Race Date"
                value={raceDate}
                style={styles.input}
                mode="outlined"
                right={<TextInput.Icon icon="calendar" />}
              />
            </View>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
          
          <TextInput
            label="Number of Aid Stations"
            value={numAidStations}
            onChangeText={setNumAidStations}
            style={styles.input}
            keyboardType="numeric"
            mode="outlined"
          />
          
          <Divider style={styles.divider} />
          
          <View style={styles.switchContainer}>
            <Text>Drop Bags Allowed</Text>
            <Switch
              value={dropBagsAllowed}
              onValueChange={setDropBagsAllowed}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text>Crew Access Allowed</Text>
            <Switch
              value={crewAllowed}
              onValueChange={setCrewAllowed}
            />
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.equipmentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mandatory Equipment</Text>
              <Button 
                mode="contained" 
                onPress={() => setEquipmentModalVisible(true)}
                style={styles.addButton}
                icon="plus"
              >
                Add Item
              </Button>
            </View>
            
            {mandatoryEquipment.length === 0 ? (
              <Text style={styles.emptyText}>No mandatory equipment added yet.</Text>
            ) : (
              <View style={styles.equipmentList}>
                {mandatoryEquipment.map((item, index) => (
                  <View key={index} style={styles.equipmentItem}>
                    <Text>{item}</Text>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => removeEquipmentItem(index)}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <Button
            mode="contained"
            onPress={handleCreateRace}
            style={styles.button}
            disabled={!raceName || !distance || !numAidStations}
          >
            {existingRace ? 'Save Changes' : 'Continue to Aid Station Setup'}
          </Button>
          
          {!existingRace && (
            <HelperText type="info" style={styles.helperText}>
              You'll be able to set up aid station details in the next step.
            </HelperText>
          )}
        </View>
      </ScrollView>
      
      <Portal>
        <Modal
          visible={equipmentModalVisible}
          onDismiss={() => setEquipmentModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Add Mandatory Equipment</Text>
          <TextInput
            label="Equipment Item"
            value={newEquipmentItem}
            onChangeText={setNewEquipmentItem}
            style={styles.modalInput}
            mode="outlined"
          />
          <View style={styles.modalButtons}>
            <Button onPress={() => setEquipmentModalVisible(false)}>Cancel</Button>
            <Button 
              mode="contained" 
              onPress={() => {
                addEquipmentItem();
                if (!newEquipmentItem.trim()) {
                  setEquipmentModalVisible(false);
                }
              }}
              disabled={!newEquipmentItem.trim()}
            >
              Add
            </Button>
          </View>
        </Modal>
      </Portal>
    </Portal.Host>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "white",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    width : "85%",
  },
  flexInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  segmentedButton: {
    width: 100,
  },
  divider: {
    marginVertical: 16,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  equipmentSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  addButton: {
    borderRadius: 20,
  },
  emptyText: {
    fontStyle: "italic",
    opacity: 0.7,
    textAlign: "center",
    marginVertical: 16,
  },
  equipmentList: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 8,
  },
  equipmentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  button: {
    marginTop: 24,
    paddingVertical: 8,
  },
  helperText: {
    textAlign: "center",
    marginTop: 8,
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalInput: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});

export default CreateRaceScreen;