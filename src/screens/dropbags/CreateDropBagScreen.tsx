/**
 * UltraEdge Create Drop Bag Screen
 * Create a new drop bag with checkpoint selection and items
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { Text, H2, H3, Body, BodySmall, Caption, Button, Card, CardContent } from '../../components/ui';
import { useDropBags, DropBagItem } from '../../context/DropBagContext';
import { useEvents } from '../../context/EventContext';
import { useCheckpoints, CHECKPOINT_TYPE_INFO } from '../../context/CheckpointContext';
import { useGear } from '../../context/GearContext';

type Props = NativeStackScreenProps<any, 'CreateDropBag'>;

export default function CreateDropBagScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();

  const initialEventId = route.params?.eventId;

  const { createDropBag } = useDropBags();
  const { events, getEvent } = useEvents();
  const { getCheckpointsByEventId } = useCheckpoints();
  const { gearItems } = useGear();

  // Form state
  const [name, setName] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || '');
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<DropBagItem[]>([]);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [showCheckpointPicker, setShowCheckpointPicker] = useState(false);
  const [showGearPicker, setShowGearPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Get checkpoints for selected event
  const eventCheckpoints = useMemo(() => {
    if (!selectedEventId) return [];
    return getCheckpointsByEventId(selectedEventId).filter(
      cp => cp.has_drop_bag || cp.checkpoint_type === 'drop_bag'
    );
  }, [selectedEventId, getCheckpointsByEventId]);

  // Get all checkpoints (for fallback)
  const allEventCheckpoints = useMemo(() => {
    if (!selectedEventId) return [];
    return getCheckpointsByEventId(selectedEventId);
  }, [selectedEventId, getCheckpointsByEventId]);

  const checkpointsToShow = eventCheckpoints.length > 0 ? eventCheckpoints : allEventCheckpoints;

  const selectedEvent = selectedEventId ? getEvent(selectedEventId) : null;
  const selectedCheckpoint = selectedCheckpointId 
    ? allEventCheckpoints.find(cp => cp.id === selectedCheckpointId) 
    : null;

  const handleAddGearItem = (gearId: string) => {
    const gear = gearItems.find(g => g.id === gearId);
    if (!gear) return;

    // Check if already added
    if (selectedItems.some(item => item.refId === gearId)) {
      Alert.alert('Already Added', 'This item is already in the drop bag.');
      return;
    }

    const newItem: DropBagItem = {
      id: 'temp_' + Date.now().toString(36),
      type: 'gear',
      refId: gearId,
      name: gear.name,
      quantity: 1,
    };

    setSelectedItems([...selectedItems, newItem]);
    setShowGearPicker(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setSelectedItems(selectedItems.map(item => {
      if (item.id === itemId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this drop bag.');
      return;
    }

    if (!selectedEventId) {
      Alert.alert('Event Required', 'Please select an event for this drop bag.');
      return;
    }

    try {
      setSaving(true);
      await createDropBag({
        name: name.trim(),
        eventId: selectedEventId,
        checkpointId: selectedCheckpointId || null,
        items: selectedItems,
        notes: notes.trim() || null,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to create drop bag:', error);
      Alert.alert('Error', 'Failed to create drop bag. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.parchment }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Name Input */}
          <View style={styles.field}>
            <Caption style={{ marginBottom: spacing.xs }}>Name *</Caption>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cream,
                  borderColor: colors.border,
                  color: colors.bark,
                },
              ]}
              placeholder="e.g., Mile 50 Bag, Night Gear"
              placeholderTextColor={colors.mist}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Event Selection */}
          <View style={styles.field}>
            <Caption style={{ marginBottom: spacing.xs }}>Event *</Caption>
            <TouchableOpacity
              style={[
                styles.selector,
                {
                  backgroundColor: colors.cream,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setShowEventPicker(!showEventPicker)}
            >
              <Ionicons 
                name="calendar" 
                size={20} 
                color={selectedEvent ? colors.forest : colors.mist} 
              />
              <Text 
                variant="body" 
                style={{ flex: 1, marginLeft: spacing.sm }}
                color={selectedEvent ? undefined : 'tertiary'}
              >
                {selectedEvent?.name || 'Select Event'}
              </Text>
              <Ionicons 
                name={showEventPicker ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.mist} 
              />
            </TouchableOpacity>

            {showEventPicker && (
              <Card style={styles.pickerDropdown}>
                <CardContent>
                  {events.length === 0 ? (
                    <Body color="secondary" align="center">
                      No events. Create one first.
                    </Body>
                  ) : (
                    events.map(event => (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.pickerItem,
                          selectedEventId === event.id && { backgroundColor: colors.forest + '10' },
                        ]}
                        onPress={() => {
                          setSelectedEventId(event.id);
                          setSelectedCheckpointId(''); // Reset checkpoint
                          setShowEventPicker(false);
                        }}
                      >
                        <Ionicons 
                          name="calendar" 
                          size={18} 
                          color={selectedEventId === event.id ? colors.forest : colors.mist} 
                        />
                        <Text 
                          variant="body" 
                          style={{ marginLeft: spacing.sm }}
                          color={selectedEventId === event.id ? undefined : 'secondary'}
                        >
                          {event.name}
                        </Text>
                      </TouchableOpacity>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </View>

          {/* Checkpoint Selection */}
          {selectedEventId && (
            <View style={styles.field}>
              <Caption style={{ marginBottom: spacing.xs }}>Checkpoint (Optional)</Caption>
              <TouchableOpacity
                style={[
                  styles.selector,
                  {
                    backgroundColor: colors.cream,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setShowCheckpointPicker(!showCheckpointPicker)}
              >
                <Ionicons 
                  name="flag" 
                  size={20} 
                  color={selectedCheckpoint ? colors.meadow : colors.mist} 
                />
                <Text 
                  variant="body" 
                  style={{ flex: 1, marginLeft: spacing.sm }}
                  color={selectedCheckpoint ? undefined : 'tertiary'}
                >
                  {selectedCheckpoint?.name || 'Select Checkpoint'}
                </Text>
                <Ionicons 
                  name={showCheckpointPicker ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={colors.mist} 
                />
              </TouchableOpacity>

              {showCheckpointPicker && (
                <Card style={styles.pickerDropdown}>
                  <CardContent>
                    {checkpointsToShow.length === 0 ? (
                      <Body color="secondary" align="center">
                        No checkpoints for this event.
                      </Body>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.pickerItem,
                            !selectedCheckpointId && { backgroundColor: colors.forest + '10' },
                          ]}
                          onPress={() => {
                            setSelectedCheckpointId('');
                            setShowCheckpointPicker(false);
                          }}
                        >
                          <Ionicons name="remove-circle-outline" size={18} color={colors.mist} />
                          <Text variant="body" style={{ marginLeft: spacing.sm }} color="tertiary">
                            No checkpoint
                          </Text>
                        </TouchableOpacity>
                        {checkpointsToShow.map(cp => {
                          const typeInfo = CHECKPOINT_TYPE_INFO[cp.checkpoint_type];
                          return (
                            <TouchableOpacity
                              key={cp.id}
                              style={[
                                styles.pickerItem,
                                selectedCheckpointId === cp.id && { backgroundColor: colors.forest + '10' },
                              ]}
                              onPress={() => {
                                setSelectedCheckpointId(cp.id);
                                setShowCheckpointPicker(false);
                              }}
                            >
                              <Ionicons 
                                name={typeInfo.icon as any} 
                                size={18} 
                                color={typeInfo.color} 
                              />
                              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                                <Text variant="body">{cp.name}</Text>
                                {cp.distance_from_start && (
                                  <Caption color="tertiary">
                                    Mile {cp.distance_from_start}
                                  </Caption>
                                )}
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </View>
          )}

          {/* Items Section */}
          <View style={styles.field}>
            <View style={styles.sectionHeader}>
              <H3>Items</H3>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.forest + '15' }]}
                onPress={() => setShowGearPicker(true)}
              >
                <Ionicons name="add" size={18} color={colors.forest} />
                <Text variant="bodySmall" style={{ color: colors.forest, marginLeft: 4 }}>
                  Add Gear
                </Text>
              </TouchableOpacity>
            </View>

            {selectedItems.length === 0 ? (
              <Card>
                <CardContent>
                  <View style={styles.emptyItems}>
                    <Ionicons name="cube-outline" size={32} color={colors.mist} />
                    <BodySmall color="tertiary" style={{ marginTop: spacing.xs }}>
                      No items added yet
                    </BodySmall>
                  </View>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  {selectedItems.map((item, index) => (
                    <View 
                      key={item.id} 
                      style={[
                        styles.itemRow,
                        index > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight },
                      ]}
                    >
                      <View style={styles.itemInfo}>
                        <Text variant="body">{item.name}</Text>
                      </View>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[styles.qtyButton, { backgroundColor: colors.cream }]}
                          onPress={() => handleUpdateQuantity(item.id, -1)}
                        >
                          <Ionicons name="remove" size={16} color={colors.stone} />
                        </TouchableOpacity>
                        <Text variant="mono" style={{ marginHorizontal: spacing.sm }}>
                          {item.quantity}
                        </Text>
                        <TouchableOpacity
                          style={[styles.qtyButton, { backgroundColor: colors.cream }]}
                          onPress={() => handleUpdateQuantity(item.id, 1)}
                        >
                          <Ionicons name="add" size={16} color={colors.stone} />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleRemoveItem(item.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.clay} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </CardContent>
              </Card>
            )}
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Caption style={{ marginBottom: spacing.xs }}>Notes</Caption>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.cream,
                  borderColor: colors.border,
                  color: colors.bark,
                },
              ]}
              placeholder="Any special instructions or reminders..."
              placeholderTextColor={colors.mist}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Gear Picker Modal */}
      {showGearPicker && (
        <View style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.parchment }]}>
            <View style={styles.modalHeader}>
              <H3>Add Gear</H3>
              <TouchableOpacity onPress={() => setShowGearPicker(false)}>
                <Ionicons name="close" size={24} color={colors.bark} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {gearItems.filter(g => !g.retired).length === 0 ? (
                <View style={styles.emptyModal}>
                  <Ionicons name="bag-handle-outline" size={40} color={colors.mist} />
                  <Body color="secondary" style={{ marginTop: spacing.sm }}>
                    No gear items. Add some from the Gear tab.
                  </Body>
                </View>
              ) : (
                gearItems
                  .filter(g => !g.retired)
                  .map(gear => (
                    <TouchableOpacity
                      key={gear.id}
                      style={[
                        styles.gearPickerItem,
                        { borderBottomColor: colors.borderLight },
                      ]}
                      onPress={() => handleAddGearItem(gear.id)}
                    >
                      <Ionicons name="cube" size={20} color={colors.trail} />
                      <View style={{ flex: 1, marginLeft: spacing.sm }}>
                        <Text variant="body">{gear.name}</Text>
                        {gear.brand && (
                          <Caption color="tertiary">{gear.brand}</Caption>
                        )}
                      </View>
                      <Ionicons name="add-circle" size={22} color={colors.forest} />
                    </TouchableOpacity>
                  ))
              )}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Save Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          onPress={handleSave}
          loading={saving}
          disabled={saving || !name.trim() || !selectedEventId}
          style={{ flex: 1 }}
        >
          Create Drop Bag
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  selector: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerDropdown: {
    marginTop: 8,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemInfo: {
    flex: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButton: {
    padding: 4,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalScroll: {
    padding: 20,
  },
  emptyModal: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  gearPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
});
