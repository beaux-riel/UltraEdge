import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Text, Card, Button, Chip, List, Divider, FAB, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRaces } from '../context/RaceContext';

const RaceDetailsScreen = ({ route, navigation }) => {
  const { id, isNew } = route.params;
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { getRaceById, deleteRace, loading } = useRaces();
  
  // Get race data from context
  const raceData = getRaceById(id) || {};
  
  // Handle if race doesn't exist
  useEffect(() => {
    if (!loading && !raceData.id) {
      Alert.alert(
        'Race Not Found',
        'The race you are looking for does not exist.',
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    }
  }, [raceData, loading, navigation]);
  
  // Handle delete race
  const handleDeleteRace = () => {
    Alert.alert(
      'Delete Race',
      `Are you sure you want to delete "${raceData.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteRace(id);
            navigation.navigate('Main');
          }
        }
      ]
    );
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading race details...</Text>
      </View>
    );
  }
  
  if (!raceData.id) {
    return null; // Will be handled by the useEffect above
  }
  
  const [activeTab, setActiveTab] = useState('overview');
  
  const renderOverviewTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.infoCard}>
        <Card.Content>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Distance:</Text>
            <Text style={styles.infoValue}>
              {raceData.distance} {raceData.distanceUnit || 'miles'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Elevation Gain:</Text>
            <Text style={styles.infoValue}>
              {raceData.elevation} {raceData.elevationUnit || 'ft'}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Race Date:</Text>
            <Text style={styles.infoValue}>{raceData.date}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Aid Stations:</Text>
            <Text style={styles.infoValue}>{raceData.numAidStations}</Text>
          </View>
          
          <View style={styles.chipContainer}>
            {raceData.dropBagsAllowed && (
              <Chip style={styles.chip} icon="bag-personal">Drop Bags</Chip>
            )}
            
            {raceData.crewAllowed && (
              <Chip style={styles.chip} icon="account-group">Crew Access</Chip>
            )}
          </View>
        </Card.Content>
      </Card>
      
      {raceData.mandatoryEquipment && raceData.mandatoryEquipment.length > 0 && (
        <Card style={styles.equipmentCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Mandatory Equipment</Text>
            <View style={styles.equipmentList}>
              {raceData.mandatoryEquipment.map((item, index) => (
                <Chip key={index} style={styles.equipmentChip} icon="check">
                  {item}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}
      
      <Card style={styles.notesCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Race Notes</Text>
          <Text>
            Tap to add notes about race strategy, gear requirements, or other important details.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button>Add Notes</Button>
        </Card.Actions>
      </Card>
    </View>
  );
  
  const renderAidStationsTab = () => (
    <View style={styles.tabContent}>
      {raceData.aidStations?.map((station, index) => (
        <Card key={station.id} style={styles.stationCard}>
          <Card.Content>
            <View style={styles.stationHeader}>
              <Text style={styles.stationName}>{station.name}</Text>
              <Text style={styles.stationDistance}>
                {raceData.distanceUnit === 'km' ? 'KM' : 'Mile'} {station.distance}
              </Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.stationDetails}>
              <Text style={styles.detailLabel}>Cut-off Time:</Text>
              <Text style={styles.detailValue}>{station.cutoffTime}</Text>
            </View>
            
            <Text style={styles.suppliesTitle}>Available:</Text>
            <View style={styles.suppliesContainer}>
              {Object.entries(station.supplies).map(([key, value]) => (
                value && (
                  <Chip key={key} style={styles.supplyChip} small>
                    {key.replace('_', ' ')}
                  </Chip>
                )
              ))}
            </View>
            
            {station.requiredEquipment && station.requiredEquipment.length > 0 && (
              <View style={styles.equipmentCheckContainer}>
                <Text style={styles.equipmentCheckTitle}>Equipment Check:</Text>
                <View style={styles.equipmentCheckList}>
                  {station.requiredEquipment.map((item, idx) => (
                    <Chip key={idx} style={styles.equipmentCheckChip} small icon="check">
                      {item}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.accessContainer}>
              {station.dropBagAllowed && (
                <Chip icon="bag-personal" style={styles.accessChip} small>Drop Bag</Chip>
              )}
              
              {station.crewAllowed && (
                <Chip icon="account-group" style={styles.accessChip} small>Crew</Chip>
              )}
            </View>
          </Card.Content>
        </Card>
      ))}
    </View>
  );
  
  const renderCrewTab = () => (
    <View style={styles.tabContent}>
      <Card style={styles.crewCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Crew Members</Text>
          
          <List.Item
            title="Add Crew Member"
            left={props => <List.Icon {...props} icon="plus-circle" />}
            onPress={() => {}}
          />
          
          <Divider />
          
          <Text style={styles.emptyState}>
            No crew members added yet. Add crew members to assign them to aid stations.
          </Text>
        </Card.Content>
      </Card>
      
      <Card style={styles.crewCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Crew Instructions</Text>
          <Text>
            Tap to add specific instructions for your crew, including meeting points, 
            driving directions, and what to bring.
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button>Add Instructions</Button>
        </Card.Actions>
      </Card>
    </View>
  );
  
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBar}>
        <Button
          mode={activeTab === 'overview' ? 'contained' : 'text'}
          onPress={() => setActiveTab('overview')}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Overview
        </Button>
        
        <Button
          mode={activeTab === 'aidStations' ? 'contained' : 'text'}
          onPress={() => setActiveTab('aidStations')}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Aid Stations
        </Button>
        
        <Button
          mode={activeTab === 'crew' ? 'contained' : 'text'}
          onPress={() => setActiveTab('crew')}
          style={styles.tabButton}
          labelStyle={styles.tabLabel}
        >
          Crew
        </Button>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'aidStations' && renderAidStationsTab()}
        {activeTab === 'crew' && renderCrewTab()}
      </ScrollView>
      
      <View style={[styles.fabContainer, { bottom: insets.bottom }]}>
        <FAB
          style={[styles.fab, styles.fabDelete]}
          icon="delete"
          onPress={handleDeleteRace}
          small
        />
        <FAB
          style={styles.fab}
          icon="pencil"
          onPress={() => navigation.navigate('CreateRace', { editMode: true, raceData })}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  infoCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    opacity: 0.7,
  },
  infoValue: {
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  chip: {
    marginRight: 8,
    marginTop: 8,
  },
  equipmentCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  equipmentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  equipmentChip: {
    margin: 4,
  },
  notesCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  stationCard: {
    marginBottom: 12,
    borderRadius: 8,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  stationDistance: {
    fontWeight: 'bold',
    opacity: 0.7,
  },
  divider: {
    marginVertical: 8,
  },
  stationDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    opacity: 0.7,
  },
  detailValue: {
    fontWeight: 'bold',
  },
  suppliesTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  suppliesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  supplyChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  equipmentCheckContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  equipmentCheckTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  equipmentCheckList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  equipmentCheckChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  accessContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  accessChip: {
    marginRight: 8,
  },
  crewCard: {
    marginBottom: 16,
    borderRadius: 8,
  },
  emptyState: {
    textAlign: 'center',
    marginVertical: 16,
    opacity: 0.7,
  },
  fabContainer: {
    position: 'absolute',
    right: 0,
    margin: 16,
  },
  fab: {
    marginTop: 8,
    backgroundColor: '#3f51b5',
  },
  fabDelete: {
    backgroundColor: '#f44336',
  },
});

export default RaceDetailsScreen;