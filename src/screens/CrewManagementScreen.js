import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, Card, Checkbox, Divider, List, useTheme as usePaperTheme, Portal, Modal, IconButton, Avatar, FAB } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaces } from '../context/RaceContext';
import { useAppTheme } from '../context/ThemeContext';

const CrewManagementScreen = ({ route, navigation }) => {
  const { raceId } = route.params;
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { getRaceById, updateRace } = useRaces();
  
  const raceData = getRaceById(raceId) || {};
  const [crewMembers, setCrewMembers] = useState([]);
  const [crewInstructions, setCrewInstructions] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCrewIndex, setEditingCrewIndex] = useState(null);
  const [currentCrew, setCurrentCrew] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    assignedStations: []
  });
  const [stationModalVisible, setStationModalVisible] = useState(false);
  const [instructionsModalVisible, setInstructionsModalVisible] = useState(false);
  
  useEffect(() => {
    // Initialize crew members and instructions from race data
    if (raceData.crewMembers) {
      setCrewMembers(raceData.crewMembers);
    }
    
    if (raceData.crewInstructions) {
      setCrewInstructions(raceData.crewInstructions);
    }
  }, [raceData]);
  
  const openAddCrewModal = () => {
    setCurrentCrew({
      name: '',
      phone: '',
      email: '',
      role: '',
      assignedStations: []
    });
    setEditingCrewIndex(null);
    setModalVisible(true);
  };
  
  const openEditCrewModal = (index) => {
    setCurrentCrew({...crewMembers[index]});
    setEditingCrewIndex(index);
    setModalVisible(true);
  };
  
  const handleSaveCrew = () => {
    // Validate crew member data
    if (!currentCrew.name.trim()) {
      Alert.alert('Missing Information', 'Please enter a name for the crew member.');
      return;
    }
    
    const updatedCrewMembers = [...crewMembers];
    
    if (editingCrewIndex !== null) {
      // Update existing crew member
      updatedCrewMembers[editingCrewIndex] = currentCrew;
    } else {
      // Add new crew member
      updatedCrewMembers.push({
        ...currentCrew,
        id: Date.now().toString() // Generate a unique ID
      });
    }
    
    setCrewMembers(updatedCrewMembers);
    setModalVisible(false);
  };
  
  const handleDeleteCrew = (index) => {
    Alert.alert(
      'Delete Crew Member',
      `Are you sure you want to remove ${crewMembers[index].name} from your crew?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const updatedCrewMembers = [...crewMembers];
            updatedCrewMembers.splice(index, 1);
            setCrewMembers(updatedCrewMembers);
          }
        }
      ]
    );
  };
  
  const openStationAssignmentModal = (index) => {
    setEditingCrewIndex(index);
    setStationModalVisible(true);
  };
  
  const toggleStationAssignment = (stationId) => {
    if (editingCrewIndex === null) return;
    
    setCrewMembers(prevCrewMembers => {
      const updatedCrewMembers = [...prevCrewMembers];
      const crewMember = {...updatedCrewMembers[editingCrewIndex]};
      
      if (!crewMember.assignedStations) {
        crewMember.assignedStations = [];
      }
      
      const stationIndex = crewMember.assignedStations.indexOf(stationId);
      
      if (stationIndex === -1) {
        // Add station
        crewMember.assignedStations.push(stationId);
      } else {
        // Remove station
        crewMember.assignedStations.splice(stationIndex, 1);
      }
      
      updatedCrewMembers[editingCrewIndex] = crewMember;
      return updatedCrewMembers;
    });
  };
  
  const openInstructionsModal = () => {
    setInstructionsModalVisible(true);
  };
  
  const handleSaveInstructions = () => {
    setInstructionsModalVisible(false);
  };
  
  const handleSaveAll = () => {
    // Update the race with crew information
    updateRace(raceId, {
      crewMembers,
      crewInstructions
    });
    
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
    card: {
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
    listItem: {
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
    },
    listItemTitle: {
      color: isDarkMode ? theme.colors.text : '#000000',
    },
    listItemDescription: {
      color: isDarkMode ? theme.colors.text : '#757575',
      opacity: 0.7,
    },
    instructionsText: {
      color: isDarkMode ? theme.colors.text : '#000000',
      fontSize: 16,
      lineHeight: 24,
      padding: 16,
    },
  };

  return (
    <Portal.Host>
      <View style={[dynamicStyles.container, { flex: 1 }]}>
        <ScrollView 
          contentContainerStyle={{
            paddingBottom: insets.bottom + 80
          }}
        >
          <View style={styles.content}>
            <Text style={dynamicStyles.title}>Crew Management</Text>
            <Text style={dynamicStyles.subtitle}>
              {raceData.name} - {raceData.distance} {raceData.distanceUnit || 'miles'}
            </Text>
            
            <Card style={dynamicStyles.card}>
              <Card.Content>
                <Text style={dynamicStyles.sectionLabel}>Crew Members</Text>
                
                {crewMembers.length > 0 ? (
                  crewMembers.map((crew, index) => (
                    <List.Item
                      key={crew.id || index}
                      title={crew.name}
                      titleStyle={dynamicStyles.listItemTitle}
                      description={crew.role || 'No role specified'}
                      descriptionStyle={dynamicStyles.listItemDescription}
                      left={props => <Avatar.Text {...props} size={40} label={crew.name.substring(0, 2).toUpperCase()} />}
                      right={props => (
                        <View style={styles.actionButtons}>
                          <IconButton
                            {...props}
                            icon="map-marker"
                            color={theme.colors.primary}
                            onPress={() => openStationAssignmentModal(index)}
                          />
                          <IconButton
                            {...props}
                            icon="pencil"
                            color={theme.colors.primary}
                            onPress={() => openEditCrewModal(index)}
                          />
                          <IconButton
                            {...props}
                            icon="delete"
                            color="red"
                            onPress={() => handleDeleteCrew(index)}
                          />
                        </View>
                      )}
                      style={dynamicStyles.listItem}
                    />
                  ))
                ) : (
                  <Text style={dynamicStyles.emptyText}>
                    No crew members added yet. Add crew members to assign them to aid stations.
                  </Text>
                )}
              </Card.Content>
            </Card>
            
            <Card style={dynamicStyles.card}>
              <Card.Content>
                <Text style={dynamicStyles.sectionLabel}>Crew Instructions</Text>
                
                {crewInstructions ? (
                  <Text style={dynamicStyles.instructionsText} numberOfLines={5}>
                    {crewInstructions}
                  </Text>
                ) : (
                  <Text style={dynamicStyles.emptyText}>
                    No instructions added yet. Tap the button below to add detailed instructions for your crew.
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button 
                  mode="outlined" 
                  onPress={openInstructionsModal}
                  color={theme.colors.primary}
                >
                  {crewInstructions ? 'Edit Instructions' : 'Add Instructions'}
                </Button>
              </Card.Actions>
            </Card>
            
            <Button
              mode="contained"
              onPress={handleSaveAll}
              style={styles.button}
            >
              Save Changes
            </Button>
          </View>
        </ScrollView>
        
        <FAB
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          icon="plus"
          onPress={openAddCrewModal}
          color="#ffffff"
        />
      </View>
      
      {/* Crew Member Modal */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={dynamicStyles.modalContainer}
        >
          <Text style={dynamicStyles.modalTitle}>
            {editingCrewIndex !== null ? 'Edit Crew Member' : 'Add Crew Member'}
          </Text>
          
          <ScrollView>
            <TextInput
              label="Name"
              value={currentCrew.name}
              onChangeText={(text) => setCurrentCrew({...currentCrew, name: text})}
              style={dynamicStyles.input}
              mode="outlined"
              theme={paperTheme}
            />
            
            <TextInput
              label="Phone"
              value={currentCrew.phone}
              onChangeText={(text) => setCurrentCrew({...currentCrew, phone: text})}
              style={dynamicStyles.input}
              mode="outlined"
              keyboardType="phone-pad"
              theme={paperTheme}
            />
            
            <TextInput
              label="Email"
              value={currentCrew.email}
              onChangeText={(text) => setCurrentCrew({...currentCrew, email: text})}
              style={dynamicStyles.input}
              mode="outlined"
              keyboardType="email-address"
              theme={paperTheme}
            />
            
            <TextInput
              label="Role (e.g., Pacer, Driver, Support)"
              value={currentCrew.role}
              onChangeText={(text) => setCurrentCrew({...currentCrew, role: text})}
              style={dynamicStyles.input}
              mode="outlined"
              theme={paperTheme}
            />
          </ScrollView>
          
          <View style={styles.modalButtons}>
            <Button 
              mode="outlined" 
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleSaveCrew}
              style={styles.modalButton}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
      
      {/* Station Assignment Modal */}
      <Portal>
        <Modal
          visible={stationModalVisible}
          onDismiss={() => setStationModalVisible(false)}
          contentContainerStyle={dynamicStyles.modalContainer}
        >
          <Text style={dynamicStyles.modalTitle}>Assign to Aid Stations</Text>
          
          {editingCrewIndex !== null && (
            <Text style={dynamicStyles.modalSubtitle}>
              Select aid stations where {crewMembers[editingCrewIndex].name} will be present:
            </Text>
          )}
          
          <ScrollView style={styles.modalScroll}>
            {raceData.aidStations && raceData.aidStations.map((station, index) => {
              // Only show stations that allow crew access
              if (!station.crewAllowed) return null;
              
              const isAssigned = editingCrewIndex !== null && 
                crewMembers[editingCrewIndex].assignedStations && 
                crewMembers[editingCrewIndex].assignedStations.includes(station.id);
              
              return (
                <Checkbox.Item
                  key={station.id}
                  label={`${station.name} (${station.distance} ${station.distanceUnit || 'miles'})`}
                  status={isAssigned ? 'checked' : 'unchecked'}
                  onPress={() => toggleStationAssignment(station.id)}
                />
              );
            })}
          </ScrollView>
          
          <Button 
            mode="contained" 
            onPress={() => setStationModalVisible(false)}
            style={styles.modalButton}
          >
            Done
          </Button>
        </Modal>
      </Portal>
      
      {/* Instructions Modal */}
      <Portal>
        <Modal
          visible={instructionsModalVisible}
          onDismiss={() => setInstructionsModalVisible(false)}
          contentContainerStyle={dynamicStyles.modalContainer}
        >
          <Text style={dynamicStyles.modalTitle}>Crew Instructions</Text>
          <Text style={dynamicStyles.modalSubtitle}>
            Add detailed instructions for your crew, including meeting points, driving directions, and what to bring.
          </Text>
          
          <TextInput
            label="Instructions"
            value={crewInstructions}
            onChangeText={setCrewInstructions}
            style={[dynamicStyles.input, { height: 200 }]}
            mode="outlined"
            multiline
            theme={paperTheme}
          />
          
          <Button 
            mode="contained" 
            onPress={handleSaveInstructions}
            style={styles.modalButton}
          >
            Save Instructions
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
  button: {
    marginTop: 16,
    marginBottom: 32,
    paddingVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default CrewManagementScreen;