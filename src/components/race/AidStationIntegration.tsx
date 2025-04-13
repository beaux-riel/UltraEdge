import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  Card, 
  Button, 
  Divider, 
  List, 
  Chip, 
  Switch,
  Portal,
  Modal,
  Checkbox,
  IconButton
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { NutritionPlan, HydrationPlan, NutritionEntry, HydrationEntry } from '../../context/NutritionHydrationContext';

interface AidStation {
  id: string;
  name: string;
  distance: number;
  cutoff?: string;
  dropBags?: boolean;
  crew?: boolean;
}

interface Race {
  id: string;
  name: string;
  date: string;
  distance: number;
  distanceUnit: string;
  aidStations?: AidStation[];
}

interface AidStationIntegrationProps {
  race: Race | null;
  nutritionPlans: NutritionPlan[];
  hydrationPlans: HydrationPlan[];
}

interface AidStationItem {
  id: string;
  type: 'nutrition' | 'hydration';
  name: string;
  details: string;
  quantity: number;
}

/**
 * Component for integrating nutrition and hydration plans with race aid stations
 */
const AidStationIntegration: React.FC<AidStationIntegrationProps> = ({ 
  race, 
  nutritionPlans, 
  hydrationPlans 
}) => {
  const { theme, isDarkMode } = useAppTheme();
  
  const [selectedAidStation, setSelectedAidStation] = useState<AidStation | null>(null);
  const [aidStationItems, setAidStationItems] = useState<Record<string, AidStationItem[]>>({});
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  
  // Handle aid station selection
  const handleSelectAidStation = (aidStation: AidStation) => {
    setSelectedAidStation(aidStation);
    
    // Initialize items for this aid station if not already done
    if (!aidStationItems[aidStation.id]) {
      setAidStationItems({
        ...aidStationItems,
        [aidStation.id]: []
      });
    }
  };
  
  // Handle adding items to aid station
  const handleAddItems = () => {
    setItemModalVisible(true);
    
    // Reset selected items
    setSelectedItems({});
  };
  
  // Handle item selection in modal
  const handleToggleItem = (id: string, selected: boolean) => {
    setSelectedItems({
      ...selectedItems,
      [id]: selected
    });
  };
  
  // Handle confirming item selection
  const handleConfirmItems = () => {
    if (!selectedAidStation) return;
    
    const newItems: AidStationItem[] = [];
    
    // Add selected nutrition items
    nutritionPlans.forEach(plan => {
      plan.entries.forEach(entry => {
        const itemId = `nutrition-${plan.id}-${entry.id}`;
        if (selectedItems[itemId]) {
          newItems.push({
            id: itemId,
            type: 'nutrition',
            name: entry.foodType,
            details: `${entry.calories} cal, ${entry.carbs}g carbs`,
            quantity: 1
          });
        }
      });
    });
    
    // Add selected hydration items
    hydrationPlans.forEach(plan => {
      plan.entries.forEach(entry => {
        const itemId = `hydration-${plan.id}-${entry.id}`;
        if (selectedItems[itemId]) {
          newItems.push({
            id: itemId,
            type: 'hydration',
            name: entry.liquidType,
            details: `${entry.volume} ${entry.volumeUnit || 'ml'}`,
            quantity: 1
          });
        }
      });
    });
    
    // Update aid station items
    setAidStationItems({
      ...aidStationItems,
      [selectedAidStation.id]: [
        ...(aidStationItems[selectedAidStation.id] || []),
        ...newItems
      ]
    });
    
    setItemModalVisible(false);
  };
  
  // Handle updating item quantity
  const handleUpdateQuantity = (aidStationId: string, itemId: string, change: number) => {
    const items = [...(aidStationItems[aidStationId] || [])];
    const itemIndex = items.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
      const newQuantity = Math.max(0, items[itemIndex].quantity + change);
      
      if (newQuantity === 0) {
        // Remove item if quantity is 0
        items.splice(itemIndex, 1);
      } else {
        // Update quantity
        items[itemIndex] = {
          ...items[itemIndex],
          quantity: newQuantity
        };
      }
      
      setAidStationItems({
        ...aidStationItems,
        [aidStationId]: items
      });
    }
  };
  
  // Render item selection modal
  const renderItemSelectionModal = () => (
    <Portal>
      <Modal
        visible={itemModalVisible}
        onDismiss={() => setItemModalVisible(false)}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff' }
        ]}
      >
        <Text style={[styles.modalTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Add Items to {selectedAidStation?.name}
        </Text>
        
        <ScrollView style={styles.modalScrollView}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Nutrition Items
          </Text>
          
          {nutritionPlans.map(plan => (
            <View key={`nutrition-${plan.id}`}>
              <Text style={[styles.planName, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {plan.name}
              </Text>
              
              {plan.entries.map(entry => {
                const itemId = `nutrition-${plan.id}-${entry.id}`;
                return (
                  <Checkbox.Item
                    key={itemId}
                    label={`${entry.foodType} (${entry.calories} cal)`}
                    status={selectedItems[itemId] ? 'checked' : 'unchecked'}
                    onPress={() => handleToggleItem(itemId, !selectedItems[itemId])}
                    labelStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                  />
                );
              })}
              
              <Divider style={styles.divider} />
            </View>
          ))}
          
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
            Hydration Items
          </Text>
          
          {hydrationPlans.map(plan => (
            <View key={`hydration-${plan.id}`}>
              <Text style={[styles.planName, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                {plan.name}
              </Text>
              
              {plan.entries.map(entry => {
                const itemId = `hydration-${plan.id}-${entry.id}`;
                return (
                  <Checkbox.Item
                    key={itemId}
                    label={`${entry.liquidType} (${entry.volume} ${entry.volumeUnit || 'ml'})`}
                    status={selectedItems[itemId] ? 'checked' : 'unchecked'}
                    onPress={() => handleToggleItem(itemId, !selectedItems[itemId])}
                    labelStyle={{ color: isDarkMode ? '#ffffff' : '#000000' }}
                  />
                );
              })}
              
              <Divider style={styles.divider} />
            </View>
          ))}
        </ScrollView>
        
        <View style={styles.modalButtons}>
          <Button
            mode="outlined"
            onPress={() => setItemModalVisible(false)}
            style={styles.modalButton}
          >
            Cancel
          </Button>
          
          <Button
            mode="contained"
            onPress={handleConfirmItems}
            style={styles.modalButton}
          >
            Add Selected
          </Button>
        </View>
      </Modal>
    </Portal>
  );
  
  // If no race is selected, show message
  if (!race) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
          Please select a race to manage aid station items
        </Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.aidStationsContainer}>
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
          Aid Stations
        </Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {race.aidStations?.map(aidStation => (
            <Chip
              key={aidStation.id}
              selected={selectedAidStation?.id === aidStation.id}
              onPress={() => handleSelectAidStation(aidStation)}
              style={[
                styles.aidStationChip,
                selectedAidStation?.id === aidStation.id && {
                  backgroundColor: isDarkMode ? theme.colors.primaryContainer : theme.colors.primary
                }
              ]}
              textStyle={{
                color: selectedAidStation?.id === aidStation.id
                  ? (isDarkMode ? '#ffffff' : '#ffffff')
                  : (isDarkMode ? '#ffffff' : '#000000')
              }}
            >
              {aidStation.name} ({aidStation.distance} {race.distanceUnit === 'miles' ? 'mi' : 'km'})
            </Chip>
          ))}
        </ScrollView>
      </View>
      
      {selectedAidStation ? (
        <Card style={styles.aidStationCard}>
          <Card.Title
            title={selectedAidStation.name}
            subtitle={`${selectedAidStation.distance} ${race.distanceUnit} ${selectedAidStation.cutoff ? `• Cutoff: ${selectedAidStation.cutoff}` : ''}`}
          />
          
          <Card.Content>
            <View style={styles.aidStationFeatures}>
              {selectedAidStation.dropBags && (
                <Chip
                  icon="bag-personal"
                  style={styles.featureChip}
                >
                  Drop Bags
                </Chip>
              )}
              
              {selectedAidStation.crew && (
                <Chip
                  icon="account-group"
                  style={styles.featureChip}
                >
                  Crew Access
                </Chip>
              )}
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.itemsHeader}>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                Items at this Aid Station
              </Text>
              
              <Button
                mode="contained"
                onPress={handleAddItems}
                icon="plus"
              >
                Add Items
              </Button>
            </View>
            
            {aidStationItems[selectedAidStation.id]?.length > 0 ? (
              aidStationItems[selectedAidStation.id].map(item => (
                <View key={item.id} style={styles.itemContainer}>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemDetails, { color: isDarkMode ? '#cccccc' : '#666666' }]}>
                      {item.details}
                    </Text>
                    <Chip
                      style={[
                        styles.itemTypeChip,
                        {
                          backgroundColor: item.type === 'nutrition'
                            ? theme.colors.primary
                            : theme.colors.blue
                        }
                      ]}
                      textStyle={{ color: '#ffffff' }}
                    >
                      {item.type === 'nutrition' ? 'Nutrition' : 'Hydration'}
                    </Chip>
                  </View>
                  
                  <View style={styles.quantityContainer}>
                    <IconButton
                      icon="minus"
                      size={20}
                      onPress={() => handleUpdateQuantity(selectedAidStation.id, item.id, -1)}
                    />
                    <Text style={[styles.quantityText, { color: isDarkMode ? '#ffffff' : '#000000' }]}>
                      {item.quantity}
                    </Text>
                    <IconButton
                      icon="plus"
                      size={20}
                      onPress={() => handleUpdateQuantity(selectedAidStation.id, item.id, 1)}
                    />
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: isDarkMode ? '#cccccc' : '#666666' }}>
                No items added yet. Click "Add Items" to add nutrition and hydration items.
              </Text>
            )}
          </Card.Content>
        </Card>
      ) : (
        <View style={styles.noSelectionContainer}>
          <Text style={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
            Select an aid station to manage items
          </Text>
        </View>
      )}
      
      {renderItemSelectionModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  aidStationsContainer: {
    marginBottom: 16,
  },
  aidStationChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  aidStationCard: {
    marginBottom: 16,
  },
  aidStationFeatures: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  featureChip: {
    marginRight: 8,
  },
  divider: {
    marginVertical: 16,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  noSelectionContainer: {
    padding: 16,
    alignItems: 'center',
  },
  modalContainer: {
    padding: 20,
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  planName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalButton: {
    marginLeft: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDetails: {
    marginBottom: 8,
  },
  itemTypeChip: {
    alignSelf: 'flex-start',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
  },
});

export default AidStationIntegration;