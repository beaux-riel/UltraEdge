/**
 * UltraEdge Edit Drop Bag Screen
 * Edit an existing drop bag's details, checkpoint, and items
 */

import React, { useState, useMemo, useEffect } from 'react';
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

type Props = NativeStackScreenProps<any, 'EditDropBag'>;

export default function EditDropBagScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  const dropBagId = route.params?.dropBagId;

  const { getDropBag, updateDropBag } = useDropBags();
  const { events, getEvent } = useEvents();
  const { getCheckpointsByEventId } = useCheckpoints();
  const { gearItems } = useGear();

  const dropBag = getDropBag(dropBagId);

  // Form state
  const [name, setName] = useState('');
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<DropBagItem[]>([]);
  const [showCheckpointPicker, setShowCheckpointPicker] = useState(false);
  const [showGearPicker, setShowGearPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form with existing data
  useEffect(() => {
    if (dropBag) {
      setName(dropBag.name);
      setSelectedCheckpointId(dropBag.checkpointId || '');
      setNotes(dropBag.notes || '');
      setSelectedItems([...dropBag.items]);
    }
  }, [dropBag]);

  // Get checkpoints for the event
  const eventCheckpoints = useMemo(() => {
    if (!dropBag) return [];
    return getCheckpointsByEventId(dropBag.eventId);
  }, [dropBag, getCheckpointsByEventId]);

  // Filter to drop bag checkpoints, but show all if none
  const dropBagCheckpoints = useMemo(() => {
    const filtered = eventCheckpoints.filter(
      cp => cp.has_drop_bag || cp.checkpoint_type === 'drop_bag'
    );
    return filtered.length > 0 ? filtered : eventCheckpoints;
  }, [eventCheckpoints]);

  const event = dropBag ? getEvent(dropBag.eventId) : null;
  const selectedCheckpoint = selectedCheckpointId 
    ? eventCheckpoints.find(cp => cp.id === selectedCheckpointId) 
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
      id: 'new_' + Date.now().toString(36),
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

    try {
      setSaving(true);
      await updateDropBag(dropBagId, {
        name: name.trim(),
        checkpointId: selectedCheckpointId || null,
        items: selectedItems,
        notes: notes.trim() || null,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update drop bag:', error);
      Alert.alert('Error', 'Failed to update drop bag. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!dropBag) {
    return (
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.mist} />
          <Body color="secondary" style={{ marginTop: spacing.md }}>
            Drop bag not found
          </Body>
          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.lg }}
          >
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Event Info (Read-only) */}
          <Card style={styles.eventInfo}>
            <CardContent>
              <Caption color="tertiary">Event</Caption>
              <View style={styles.eventRow}>
                <Ionicons name="calendar" size={18} color={colors.forest} />
                <Text variant="body" style={{ marginLeft: spacing.sm }}>
                  {event?.name || 'Unknown Event'}
                </Text>
              </View>
            </CardContent>
          </Card>

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

          {/* Checkpoint Selection */}
          <View style={styles.field}>
            <Caption style={{ marginBottom: spacing.xs }}>Checkpoint</Caption>
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
                  {dropBagCheckpoints.length === 0 ? (
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
                      {dropBagCheckpoints.map(cp => {
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

      {/* Save Button - Fixed at bottom */}
      <View style={[styles.fixedFooter, { 
        paddingBottom: insets.bottom + spacing.md,
        backgroundColor: colors.parchment,
        borderTopColor: colors.border,
      }]}>
        <Button
          onPress={handleSave}
          loading={saving}
          disabled={saving || !name.trim()}
          style={{ flex: 1 }}
        >
          Save Changes
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  eventInfo: {
    marginBottom: 20,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
});
