import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Card, Text, IconButton, Chip, Menu, Divider, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ThemeContext';

/**
 * Component to display a list of nutrition entries with edit/delete functionality
 * @param {Object} props - Component props
 * @param {Array} props.entries - Array of nutrition entry objects
 * @param {function} props.onEdit - Function called when an entry is edited
 * @param {function} props.onDelete - Function called when an entry is deleted
 * @param {function} props.onReorder - Function called when entries are reordered
 * @param {function} props.onAdd - Function called when add button is pressed
 */
const NutritionEntryList = ({ entries = [], onEdit, onDelete, onReorder, onAdd }) => {
  const { theme, isDarkMode } = useAppTheme();
  const [selectedEntries, setSelectedEntries] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const [activeEntryId, setActiveEntryId] = useState(null);
  
  // Toggle entry selection
  const toggleEntrySelection = (entryId) => {
    if (selectedEntries.includes(entryId)) {
      setSelectedEntries(selectedEntries.filter(id => id !== entryId));
    } else {
      setSelectedEntries([...selectedEntries, entryId]);
    }
  };
  
  // Show context menu for an entry
  const showMenu = (event, entryId) => {
    setMenuAnchor({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    setMenuVisible(true);
    setActiveEntryId(entryId);
  };
  
  // Handle edit action
  const handleEdit = () => {
    setMenuVisible(false);
    if (activeEntryId) {
      onEdit(activeEntryId);
    }
  };
  
  // Handle delete action
  const handleDelete = () => {
    setMenuVisible(false);
    if (activeEntryId) {
      Alert.alert(
        'Delete Entry',
        'Are you sure you want to delete this entry?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => onDelete(activeEntryId)
          }
        ]
      );
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedEntries.length > 0) {
      Alert.alert(
        'Delete Entries',
        `Are you sure you want to delete ${selectedEntries.length} entries?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              selectedEntries.forEach(id => onDelete(id));
              setSelectedEntries([]);
            }
          }
        ]
      );
    }
  };
  
  // Render location icon based on source location
  const renderLocationIcon = (location) => {
    switch (location) {
      case 'aid_station':
        return 'tent';
      case 'drop_bag':
        return 'bag-personal';
      case 'crew':
        return 'account-group';
      case 'carried':
      default:
        return 'bag-carry-on';
    }
  };
  
  // Render an entry item
  const renderEntryItem = ({ item }) => {
    const isSelected = selectedEntries.includes(item.id);
    
    return (
      <Card 
        style={[
          styles.entryCard,
          isSelected && { backgroundColor: theme.colors.primaryContainer }
        ]}
        onLongPress={() => toggleEntrySelection(item.id)}
      >
        <View style={styles.entryHeader}>
          <View style={styles.entryTitleContainer}>
            {selectedEntries.length > 0 && (
              <IconButton
                icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={20}
                onPress={() => toggleEntrySelection(item.id)}
                style={styles.checkboxIcon}
              />
            )}
            <Text style={styles.entryTitle}>{item.foodType}</Text>
            {item.isEssential && (
              <Chip 
                style={styles.essentialChip}
                textStyle={{ fontSize: 10 }}
                icon="star"
              >
                Essential
              </Chip>
            )}
          </View>
          
          <IconButton
            icon="dots-vertical"
            size={20}
            onPress={(e) => showMenu(e, item.id)}
          />
        </View>
        
        <View style={styles.entryDetails}>
          <View style={styles.entryDetail}>
            <Text style={styles.detailLabel}>Calories:</Text>
            <Text style={styles.detailValue}>{item.calories || 0}</Text>
          </View>
          
          <View style={styles.entryDetail}>
            <Text style={styles.detailLabel}>Carbs:</Text>
            <Text style={styles.detailValue}>{item.carbs || 0}g</Text>
          </View>
          
          <View style={styles.entryDetail}>
            <Text style={styles.detailLabel}>Protein:</Text>
            <Text style={styles.detailValue}>{item.protein || 0}g</Text>
          </View>
          
          <View style={styles.entryDetail}>
            <Text style={styles.detailLabel}>Fat:</Text>
            <Text style={styles.detailValue}>{item.fat || 0}g</Text>
          </View>
        </View>
        
        {(item.timing || item.frequency) && (
          <View style={styles.entryTiming}>
            {item.timing && (
              <Chip icon="clock-outline" style={styles.timingChip}>
                {item.timing}
              </Chip>
            )}
            {item.frequency && (
              <Chip icon="refresh" style={styles.timingChip}>
                {item.frequency}
              </Chip>
            )}
          </View>
        )}
        
        <View style={styles.entryFooter}>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityText}>
              {item.quantity || 1} {item.quantityUnit || 'pcs'}
            </Text>
          </View>
          
          <MaterialCommunityIcons
            name={renderLocationIcon(item.sourceLocation)}
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      </Card>
    );
  };
  
  // Render empty list message
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="food-apple-outline"
        size={48}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.emptyText}>No nutrition entries yet</Text>
      <Button 
        mode="contained" 
        onPress={onAdd}
        style={styles.addButton}
      >
        Add First Entry
      </Button>
    </View>
  );
  
  // Render list header with actions
  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={styles.listTitle}>Nutrition Entries</Text>
      
      <View style={styles.listActions}>
        {selectedEntries.length > 0 ? (
          <>
            <Button 
              mode="outlined" 
              onPress={() => setSelectedEntries([])}
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button 
              mode="contained" 
              onPress={handleBulkDelete}
              style={styles.actionButton}
              buttonColor={theme.colors.error}
            >
              Delete ({selectedEntries.length})
            </Button>
          </>
        ) : (
          <Button 
            mode="contained" 
            onPress={onAdd}
            style={styles.actionButton}
            icon="plus"
          >
            Add Entry
          </Button>
        )}
      </View>
    </View>
  );
  
  return (
    <View style={styles.container}>
      {renderListHeader()}
      
      <FlatList
        data={entries}
        renderItem={renderEntryItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={entries.length === 0 ? { flex: 1 } : null}
      />
      
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={menuAnchor}
      >
        <Menu.Item 
          onPress={handleEdit} 
          title="Edit" 
          leadingIcon="pencil"
        />
        <Divider />
        <Menu.Item 
          onPress={handleDelete} 
          title="Delete" 
          leadingIcon="delete"
          titleStyle={{ color: theme.colors.error }}
        />
      </Menu>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 8,
  },
  entryCard: {
    marginHorizontal: 16,
    marginVertical: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  entryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxIcon: {
    margin: 0,
    marginRight: 4,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  essentialChip: {
    marginLeft: 8,
    height: 24,
  },
  entryDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  entryDetail: {
    flexDirection: 'row',
    marginRight: 16,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  entryTiming: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  timingChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    opacity: 0.7,
  },
  addButton: {
    paddingHorizontal: 16,
  },
});

export default NutritionEntryList;