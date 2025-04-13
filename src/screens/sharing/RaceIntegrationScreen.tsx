import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Divider, 
  List, 
  Chip, 
  Switch,
  SegmentedButtons,
  Portal,
  Modal,
  RadioButton
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { useNutritionHydration } from '../../context/NutritionHydrationContext';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import AidStationIntegration from '../../components/race/AidStationIntegration';
import RacePlanAssignment from '../../components/race/RacePlanAssignment';
import SharingSystem from '../../components/sharing/SharingSystem';

type RaceIntegrationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'RaceIntegration'
>;

interface Race {
  id: string;
  name: string;
  date: string;
  distance: number;
  distanceUnit: string;
  aidStations?: Array<{
    id: string;
    name: string;
    distance: number;
    cutoff?: string;
    dropBags?: boolean;
    crew?: boolean;
  }>;
}

/**
 * Screen for integrating nutrition and hydration plans with races
 */
const RaceIntegrationScreen: React.FC<RaceIntegrationScreenProps> = ({ route, navigation }) => {
  const { theme, isDarkMode } = useAppTheme();
  const { nutritionPlans, hydrationPlans } = useNutritionHydration();
  
  const [activeTab, setActiveTab] = useState<'assign' | 'aid' | 'share'>('assign');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [raceModalVisible, setRaceModalVisible] = useState(false);
  const [races, setRaces] = useState<Race[]>([
    {
      id: '1',
      name: 'Mountain Trail 100',
      date: '2023-06-15',
      distance: 100,
      distanceUnit: 'miles',
      aidStations: [
        { id: 'a1', name: 'Start', distance: 0, crew: true, dropBags: true },
        { id: 'a2', name: 'River Crossing', distance: 15.5, cutoff: '4:00' },
        { id: 'a3', name: 'Summit Pass', distance: 32.1, cutoff: '8:30', crew: true },
        { id: 'a4', name: 'Valley View', distance: 47.8, cutoff: '13:00', dropBags: true },
        { id: 'a5', name: 'Turnaround', distance: 50, cutoff: '14:00', crew: true, dropBags: true },
        { id: 'a6', name: 'Valley View', distance: 52.2, cutoff: '15:00', dropBags: true },
        { id: 'a7', name: 'Summit Pass', distance: 67.9, cutoff: '20:00', crew: true },
        { id: 'a8', name: 'River Crossing', distance: 84.5, cutoff: '26:00' },
        { id: 'a9', name: 'Finish', distance: 100, cutoff: '30:00', crew: true, dropBags: true }
      ]
    },
    {
      id: '2',
      name: 'Desert Ultra 50k',
      date: '2023-09-22',
      distance: 50,
      distanceUnit: 'kilometers',
      aidStations: [
        { id: 'b1', name: 'Start', distance: 0, crew: true },
        { id: 'b2', name: 'Oasis', distance: 12.5, cutoff: '2:30' },
        { id: 'b3', name: 'Canyon Edge', distance: 25, cutoff: '5:00', crew: true, dropBags: true },
        { id: 'b4', name: 'Last Water', distance: 37.5, cutoff: '7:30' },
        { id: 'b5', name: 'Finish', distance: 50, cutoff: '10:00', crew: true }
      ]
    }
  ]);
  
  // Initialize selected race from route params if provided
  useEffect(() => {
    if (route.params?.raceId) {
      const race = races.find(r => r.id === route.params.raceId);
      if (race) {
        setSelectedRace(race);
      }
    }
  }, [route.params]);
  
  // Handle race selection
  const handleSelectRace = (race: Race) => {
    setSelectedRace(race);
    setRaceModalVisible(false);
  };
  
  // Render race selection modal
  const renderRaceSelectionModal = () => (
    <Portal>
      <Modal
        visible={raceModalVisible}
        onDismiss={() => setRaceModalVisible(false)}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
        ]}
      >
        <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Select Race
        </Text>
        
        <RadioButton.Group
          onValueChange={(value) => {
            const race = races.find(r => r.id === value);
            if (race) handleSelectRace(race);
          }}
          value={selectedRace?.id || ''}
        >
          {races.map((race) => (
            <RadioButton.Item
              key={race.id}
              label={`${race.name} (${race.distance} ${race.distanceUnit})`}
              value={race.id}
              style={styles.radioItem}
              labelStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
            />
          ))}
        </RadioButton.Group>
        
        <Button
          mode="contained"
          onPress={() => setRaceModalVisible(false)}
          style={styles.modalButton}
        >
          Cancel
        </Button>
      </Modal>
    </Portal>
  );
  
  // Render race selection
  const renderRaceSelection = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Selected Race
        </Text>
        
        {selectedRace ? (
          <View style={styles.selectedRaceContainer}>
            <Text style={[styles.raceName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
              {selectedRace.name}
            </Text>
            <Text style={[styles.raceDetails, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
              {selectedRace.distance} {selectedRace.distanceUnit} • {selectedRace.date}
            </Text>
            <Text style={[styles.raceDetails, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
              {selectedRace.aidStations?.length || 0} aid stations
            </Text>
            
            <Button
              mode="outlined"
              onPress={() => setRaceModalVisible(true)}
              style={styles.changeRaceButton}
            >
              Change Race
            </Button>
          </View>
        ) : (
          <Button
            mode="contained"
            onPress={() => setRaceModalVisible(true)}
            style={styles.selectRaceButton}
          >
            Select Race
          </Button>
        )}
      </Card.Content>
    </Card>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
      {renderRaceSelection()}
      
      <SegmentedButtons
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'assign' | 'aid' | 'share')}
        buttons={[
          { value: 'assign', label: 'Assign Plans' },
          { value: 'aid', label: 'Aid Stations' },
          { value: 'share', label: 'Share' }
        ]}
        style={styles.tabButtons}
      />
      
      <ScrollView style={styles.scrollView}>
        {activeTab === 'assign' && (
          <RacePlanAssignment
            race={selectedRace}
            nutritionPlans={Object.values(nutritionPlans)}
            hydrationPlans={Object.values(hydrationPlans)}
          />
        )}
        
        {activeTab === 'aid' && (
          <AidStationIntegration
            race={selectedRace}
            nutritionPlans={Object.values(nutritionPlans)}
            hydrationPlans={Object.values(hydrationPlans)}
          />
        )}
        
        {activeTab === 'share' && (
          <SharingSystem
            race={selectedRace}
            nutritionPlans={Object.values(nutritionPlans)}
            hydrationPlans={Object.values(hydrationPlans)}
          />
        )}
      </ScrollView>
      
      {renderRaceSelectionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  selectedRaceContainer: {
    marginBottom: 8,
  },
  raceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  raceDetails: {
    marginBottom: 4,
  },
  selectRaceButton: {
    marginTop: 8,
  },
  changeRaceButton: {
    marginTop: 8,
  },
  tabButtons: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  radioItem: {
    marginVertical: 4,
  },
  modalButton: {
    marginTop: 16,
  },
});

export default RaceIntegrationScreen;