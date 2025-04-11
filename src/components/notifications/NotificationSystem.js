import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { 
  Card, 
  Text, 
  Button, 
  Divider, 
  List, 
  Chip, 
  Switch,
  Portal,
  Modal,
  TextInput,
  IconButton,
  SegmentedButtons,
  RadioButton,
  DataTable
} from 'react-native-paper';
import { useAppTheme } from '../../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Component for managing notifications related to nutrition and hydration plans
 * @param {Object} props - Component props
 * @param {Array} props.races - Array of race objects
 * @param {Array} props.nutritionPlans - Array of nutrition plan objects
 * @param {Array} props.hydrationPlans - Array of hydration plan objects
 * @param {Array} props.notifications - Array of existing notification objects
 * @param {function} props.onCreateNotification - Function called when a new notification is created
 * @param {function} props.onUpdateNotification - Function called when a notification is updated
 * @param {function} props.onDeleteNotification - Function called when a notification is deleted
 * @param {function} props.onGenerateShoppingList - Function called when a shopping list is generated
 */
const NotificationSystem = ({ 
  races = [], 
  nutritionPlans = [], 
  hydrationPlans = [],
  notifications = [],
  onCreateNotification,
  onUpdateNotification,
  onDeleteNotification,
  onGenerateShoppingList
}) => {
  const { theme, isDarkMode } = useAppTheme();
  const [selectedRace, setSelectedRace] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create'); // 'create', 'edit', or 'shopping'
  const [activeNotificationId, setActiveNotificationId] = useState(null);
  const [notificationType, setNotificationType] = useState('pre_race');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationDate, setNotificationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [notificationRecurring, setNotificationRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState('daily');
  const [shoppingListItems, setShoppingListItems] = useState([]);
  
  // Handle race selection
  const handleRaceSelection = (race) => {
    setSelectedRace(race);
  };
  
  // Show create notification modal
  const showCreateNotificationModal = () => {
    if (!selectedRace) {
      Alert.alert('Error', 'Please select a race first');
      return;
    }
    
    setModalType('create');
    setNotificationType('pre_race');
    setNotificationTitle('Race Reminder');
    setNotificationMessage(`Don't forget to prepare for ${selectedRace.name}`);
    setNotificationDate(new Date(selectedRace.date));
    setNotificationEnabled(true);
    setNotificationRecurring(false);
    setRecurringInterval('daily');
    setModalVisible(true);
  };
  
  // Show edit notification modal
  const showEditNotificationModal = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    setModalType('edit');
    setActiveNotificationId(notificationId);
    setNotificationType(notification.type);
    setNotificationTitle(notification.title);
    setNotificationMessage(notification.message);
    setNotificationDate(new Date(notification.date));
    setNotificationEnabled(notification.enabled);
    setNotificationRecurring(notification.recurring);
    setRecurringInterval(notification.recurringInterval || 'daily');
    setModalVisible(true);
  };
  
  // Show shopping list modal
  const showShoppingListModal = () => {
    if (!selectedRace) {
      Alert.alert('Error', 'Please select a race first');
      return;
    }
    
    // Generate shopping list based on race plans
    generateShoppingList();
    
    setModalType('shopping');
    setModalVisible(true);
  };
  
  // Generate shopping list
  const generateShoppingList = () => {
    // Get all nutrition and hydration plans for the selected race
    const racePlans = [];
    
    // Add nutrition plans
    nutritionPlans.forEach(plan => {
      if (plan.raceId === selectedRace.id) {
        racePlans.push({
          type: 'nutrition',
          plan
        });
      }
    });
    
    // Add hydration plans
    hydrationPlans.forEach(plan => {
      if (plan.raceId === selectedRace.id) {
        racePlans.push({
          type: 'hydration',
          plan
        });
      }
    });
    
    // Generate shopping list items
    const items = [];
    
    // Process nutrition plans
    racePlans.filter(p => p.type === 'nutrition').forEach(({ plan }) => {
      plan.entries.forEach(entry => {
        // Skip items that are provided at aid stations
        if (entry.sourceLocation === 'aid_station') return;
        
        // Calculate quantity needed
        let quantity = entry.quantity || 1;
        
        // If there's frequency information, adjust quantity
        if (entry.frequency && entry.frequency.includes('hour')) {
          const raceHours = selectedRace.duration || 10;
          const match = entry.frequency.match(/(\d+)/);
          if (match) {
            const frequencyHours = parseInt(match[1], 10);
            quantity = Math.ceil(raceHours / frequencyHours) * quantity;
          }
        }
        
        // Add to shopping list
        items.push({
          id: `nutrition-${entry.id}`,
          name: entry.foodType,
          quantity,
          unit: entry.quantityUnit || 'pcs',
          type: 'nutrition',
          checked: false
        });
      });
    });
    
    // Process hydration plans
    racePlans.filter(p => p.type === 'hydration').forEach(({ plan }) => {
      plan.entries.forEach(entry => {
        // Skip items that are provided at aid stations
        if (entry.sourceLocation === 'aid_station') return;
        
        // Calculate quantity needed
        let quantity = 1;
        
        // If there's frequency information, adjust quantity
        if (entry.frequency && entry.frequency.includes('hour')) {
          const raceHours = selectedRace.duration || 10;
          const match = entry.frequency.match(/(\d+)/);
          if (match) {
            const frequencyHours = parseInt(match[1], 10);
            quantity = Math.ceil(raceHours / frequencyHours) * quantity;
          }
        }
        
        // Add to shopping list
        items.push({
          id: `hydration-${entry.id}`,
          name: entry.liquidType,
          quantity,
          unit: entry.containerType || 'bottle',
          type: 'hydration',
          checked: false
        });
      });
    });
    
    setShoppingListItems(items);
  };
  
  // Handle create notification
  const handleCreateNotification = () => {
    if (!selectedRace) return;
    
    onCreateNotification({
      raceId: selectedRace.id,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      date: notificationDate.toISOString(),
      enabled: notificationEnabled,
      recurring: notificationRecurring,
      recurringInterval: notificationRecurring ? recurringInterval : null
    });
    
    setModalVisible(false);
  };
  
  // Handle update notification
  const handleUpdateNotification = () => {
    if (!activeNotificationId) return;
    
    onUpdateNotification(activeNotificationId, {
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      date: notificationDate.toISOString(),
      enabled: notificationEnabled,
      recurring: notificationRecurring,
      recurringInterval: notificationRecurring ? recurringInterval : null
    });
    
    setModalVisible(false);
  };
  
  // Handle delete notification
  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDeleteNotification(notificationId);
            if (modalVisible && activeNotificationId === notificationId) {
              setModalVisible(false);
            }
          }
        }
      ]
    );
  };
  
  // Handle save shopping list
  const handleSaveShoppingList = () => {
    onGenerateShoppingList(selectedRace.id, shoppingListItems);
    setModalVisible(false);
  };
  
  // Toggle shopping list item
  const toggleShoppingItem = (itemId) => {
    setShoppingListItems(
      shoppingListItems.map(item => 
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  };
  
  // Get notification type label
  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'pre_race':
        return 'Pre-Race Reminder';
      case 'training':
        return 'Training Reminder';
      case 'plan_update':
        return 'Plan Update';
      case 'custom':
        return 'Custom';
      default:
        return 'Notification';
    }
  };
  
  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pre_race':
        return 'flag-checkered';
      case 'training':
        return 'run';
      case 'plan_update':
        return 'update';
      case 'custom':
        return 'bell';
      default:
        return 'bell-outline';
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Render race selection
  const renderRaceSelection = () => {
    if (races.length === 0) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyText}>No races available</Text>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Select Race" />
        <Card.Content>
          <ScrollView style={styles.raceList}>
            {races.map(race => {
              const isSelected = selectedRace && selectedRace.id === race.id;
              
              return (
                <List.Item
                  key={race.id}
                  title={race.name}
                  description={race.date}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    />
                  )}
                  onPress={() => handleRaceSelection(race)}
                  style={[
                    styles.raceItem,
                    isSelected && { backgroundColor: theme.colors.primaryContainer }
                  ]}
                />
              );
            })}
          </ScrollView>
        </Card.Content>
      </Card>
    );
  };
  
  // Render notification options
  const renderNotificationOptions = () => {
    if (!selectedRace) {
      return (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.emptyText}>Select a race to manage notifications</Text>
          </Card.Content>
        </Card>
      );
    }
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Notification Options" subtitle={selectedRace.name} />
        <Card.Content>
          <View style={styles.optionsRow}>
            <Button 
              mode="contained" 
              onPress={showCreateNotificationModal}
              style={styles.optionButton}
              icon="bell-plus"
            >
              Add Notification
            </Button>
            <Button 
              mode="contained" 
              onPress={showShoppingListModal}
              style={styles.optionButton}
              icon="cart"
            >
              Shopping List
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };
  
  // Render notifications
  const renderNotifications = () => {
    if (!selectedRace) return null;
    
    const raceNotifications = notifications.filter(n => n.raceId === selectedRace.id);
    
    return (
      <Card style={styles.card}>
        <Card.Title title="Notifications" />
        <Card.Content>
          {raceNotifications.length === 0 ? (
            <Text style={styles.emptyText}>No notifications set for this race</Text>
          ) : (
            <List.Section>
              {raceNotifications.map(notification => (
                <List.Item
                  key={notification.id}
                  title={notification.title}
                  description={formatDate(notification.date)}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={getNotificationIcon(notification.type)}
                    />
                  )}
                  right={props => (
                    <View style={styles.notificationActions}>
                      <Switch
                        value={notification.enabled}
                        onValueChange={(value) => 
                          onUpdateNotification(notification.id, { enabled: value })
                        }
                      />
                      <IconButton
                        {...props}
                        icon="pencil"
                        onPress={() => showEditNotificationModal(notification.id)}
                      />
                    </View>
                  )}
                  style={[
                    styles.notificationItem,
                    !notification.enabled && styles.disabledNotification
                  ]}
                />
              ))}
            </List.Section>
          )}
        </Card.Content>
      </Card>
    );
  };
  
  // Render create/edit notification modal
  const renderNotificationModal = () => {
    return (
      <Card>
        <Card.Title 
          title={modalType === 'create' ? 'Create Notification' : 'Edit Notification'} 
        />
        <Card.Content>
          <Text style={styles.sectionTitle}>Notification Type</Text>
          <SegmentedButtons
            value={notificationType}
            onValueChange={setNotificationType}
            buttons={[
              { value: 'pre_race', label: 'Pre-Race' },
              { value: 'training', label: 'Training' },
              { value: 'custom', label: 'Custom' }
            ]}
            style={styles.typeButtons}
          />
          
          <TextInput
            label="Title"
            value={notificationTitle}
            onChangeText={setNotificationTitle}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Message"
            value={notificationMessage}
            onChangeText={setNotificationMessage}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Notification Date:</Text>
            <Button 
              mode="outlined"
              onPress={() => setShowDatePicker(true)}
            >
              {notificationDate.toLocaleDateString()}
            </Button>
          </View>
          
          {/* Date picker would go here - using button only for now */}
          
          <View style={styles.switchRow}>
            <Text>Enable Notification</Text>
            <Switch
              value={notificationEnabled}
              onValueChange={setNotificationEnabled}
            />
          </View>
          
          <View style={styles.switchRow}>
            <Text>Recurring Notification</Text>
            <Switch
              value={notificationRecurring}
              onValueChange={setNotificationRecurring}
            />
          </View>
          
          {notificationRecurring && (
            <RadioButton.Group
              value={recurringInterval}
              onValueChange={setRecurringInterval}
            >
              <View style={styles.radioRow}>
                <RadioButton.Item
                  label="Daily"
                  value="daily"
                />
              </View>
              <View style={styles.radioRow}>
                <RadioButton.Item
                  label="Weekly"
                  value="weekly"
                />
              </View>
              <View style={styles.radioRow}>
                <RadioButton.Item
                  label="Monthly"
                  value="monthly"
                />
              </View>
            </RadioButton.Group>
          )}
          
          {modalType === 'edit' && (
            <Button 
              mode="outlined" 
              onPress={() => handleDeleteNotification(activeNotificationId)}
              style={styles.deleteButton}
              icon="delete"
              textColor={theme.colors.error}
            >
              Delete Notification
            </Button>
          )}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={modalType === 'create' ? handleCreateNotification : handleUpdateNotification}
          >
            {modalType === 'create' ? 'Create' : 'Update'}
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  // Render shopping list modal
  const renderShoppingListModal = () => {
    return (
      <Card>
        <Card.Title title={`Shopping List for ${selectedRace?.name}`} />
        <Card.Content>
          {shoppingListItems.length === 0 ? (
            <Text style={styles.emptyText}>No items in shopping list</Text>
          ) : (
            <ScrollView style={styles.shoppingList}>
              <DataTable>
                <DataTable.Header>
                  <DataTable.Title style={{ flex: 0.5 }}></DataTable.Title>
                  <DataTable.Title>Item</DataTable.Title>
                  <DataTable.Title numeric>Quantity</DataTable.Title>
                  <DataTable.Title style={{ flex: 0.7 }}>Type</DataTable.Title>
                </DataTable.Header>
                
                {shoppingListItems.map(item => (
                  <DataTable.Row key={item.id}>
                    <DataTable.Cell style={{ flex: 0.5 }}>
                      <IconButton
                        icon={item.checked ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        onPress={() => toggleShoppingItem(item.id)}
                        size={20}
                      />
                    </DataTable.Cell>
                    <DataTable.Cell>{item.name}</DataTable.Cell>
                    <DataTable.Cell numeric>{item.quantity} {item.unit}</DataTable.Cell>
                    <DataTable.Cell style={{ flex: 0.7 }}>
                      <Chip
                        style={[
                          styles.typeChip,
                          { 
                            backgroundColor: item.type === 'nutrition' 
                              ? theme.colors.primaryContainer 
                              : theme.colors.secondaryContainer 
                          }
                        ]}
                      >
                        {item.type === 'nutrition' ? 'Food' : 'Drink'}
                      </Chip>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </ScrollView>
          )}
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => setModalVisible(false)}>Cancel</Button>
          <Button 
            mode="contained"
            onPress={handleSaveShoppingList}
            disabled={shoppingListItems.length === 0}
          >
            Save List
          </Button>
        </Card.Actions>
      </Card>
    );
  };
  
  return (
    <View style={styles.container}>
      {renderRaceSelection()}
      {renderNotificationOptions()}
      {renderNotifications()}
      
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => setModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {modalType === 'shopping' 
            ? renderShoppingListModal() 
            : renderNotificationModal()}
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
  card: {
    marginVertical: 8,
  },
  raceList: {
    maxHeight: 200,
  },
  raceItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  notificationActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationItem: {
    marginBottom: 4,
  },
  disabledNotification: {
    opacity: 0.6,
  },
  modalContainer: {
    padding: 16,
    margin: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  typeButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioRow: {
    marginBottom: 4,
  },
  deleteButton: {
    marginTop: 16,
  },
  shoppingList: {
    maxHeight: 400,
  },
  typeChip: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default NotificationSystem;