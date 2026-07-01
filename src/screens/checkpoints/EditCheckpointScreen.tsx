/**
 * UltraEdge Edit Checkpoint Screen
 * Form to edit an existing checkpoint/aid station
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { Text, H1, H2, H3, Body, BodySmall, Label, Caption, Button, Card, CardContent } from '../../components/ui';
import { useCheckpoints, CHECKPOINT_TYPE_INFO } from '../../context/CheckpointContext';
import { CheckpointType, CheckpointUpdate } from '../../lib/database.types';

type RootStackParamList = {
  EditCheckpoint: { eventId: string; checkpointId: string };
  CheckpointDetail: { eventId: string; checkpointId: string };
  CheckpointsList: { eventId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EditCheckpoint'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'EditCheckpoint'>;

const CHECKPOINT_TYPES: CheckpointType[] = [
  'start',
  'aid_station',
  'crew_access',
  'drop_bag',
  'gear_check',
  'timing',
  'finish',
  'other',
];

const COMMON_SUPPLIES = [
  'Water',
  'Sports Drink',
  'Soda/Cola',
  'Fruit',
  'Sandwiches',
  'Soup/Broth',
  'Energy Gels',
  'Electrolytes',
  'Coffee',
  'Tea',
  'Ice',
  'Medical Kit',
  'Sunscreen',
  'Salt Tabs',
];

export default function EditCheckpointScreen() {
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  
  const { eventId, checkpointId } = route.params;
  const { getCheckpointById, updateCheckpoint } = useCheckpoints();
  
  const checkpoint = useMemo(() => 
    getCheckpointById(eventId, checkpointId),
    [getCheckpointById, eventId, checkpointId]
  );
  
  // Form state - initialized from existing checkpoint
  const [name, setName] = useState('');
  const [checkpointType, setCheckpointType] = useState<CheckpointType>('aid_station');
  const [distance, setDistance] = useState('');
  const [elevation, setElevation] = useState('');
  const [cutoffTime, setCutoffTime] = useState('');
  const [locationDescription, setLocationDescription] = useState('');
  const [hasCrewAccess, setHasCrewAccess] = useState(false);
  const [hasDropBag, setHasDropBag] = useState(false);
  const [hasPacerPickup, setHasPacerPickup] = useState(false);
  const [hasPacerDropoff, setHasPacerDropoff] = useState(false);
  const [selectedSupplies, setSelectedSupplies] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with checkpoint data
  useEffect(() => {
    if (checkpoint) {
      setName(checkpoint.name);
      setCheckpointType(checkpoint.checkpoint_type);
      setDistance(checkpoint.distance_from_start?.toString() || '');
      setElevation(checkpoint.elevation?.toString() || '');
      setCutoffTime(checkpoint.cutoff_time || '');
      setLocationDescription(checkpoint.location_description || '');
      setHasCrewAccess(checkpoint.has_crew_access);
      setHasDropBag(checkpoint.has_drop_bag);
      setHasPacerPickup(checkpoint.has_pacer_pickup);
      setHasPacerDropoff(checkpoint.has_pacer_dropoff);
      setSelectedSupplies(checkpoint.aid_supplies || []);
      setNotes(checkpoint.notes || '');
    }
  }, [checkpoint]);

  // Track changes
  useEffect(() => {
    if (checkpoint) {
      const changed = 
        name !== checkpoint.name ||
        checkpointType !== checkpoint.checkpoint_type ||
        distance !== (checkpoint.distance_from_start?.toString() || '') ||
        elevation !== (checkpoint.elevation?.toString() || '') ||
        cutoffTime !== (checkpoint.cutoff_time || '') ||
        locationDescription !== (checkpoint.location_description || '') ||
        hasCrewAccess !== checkpoint.has_crew_access ||
        hasDropBag !== checkpoint.has_drop_bag ||
        hasPacerPickup !== checkpoint.has_pacer_pickup ||
        hasPacerDropoff !== checkpoint.has_pacer_dropoff ||
        JSON.stringify(selectedSupplies.sort()) !== JSON.stringify((checkpoint.aid_supplies || []).sort()) ||
        notes !== (checkpoint.notes || '');
      setHasChanges(changed);
    }
  }, [
    checkpoint, name, checkpointType, distance, elevation, cutoffTime,
    locationDescription, hasCrewAccess, hasDropBag, hasPacerPickup,
    hasPacerDropoff, selectedSupplies, notes
  ]);

  // Handle case where checkpoint doesn't exist
  if (!checkpoint) {
    return (
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.mist} />
          <H3 style={{ marginTop: spacing.md }}>Checkpoint Not Found</H3>
          <Body color="secondary" style={{ marginTop: spacing.xs }}>
            This checkpoint may have been deleted.
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

  const toggleSupply = useCallback((supply: string) => {
    setSelectedSupplies(prev =>
      prev.includes(supply)
        ? prev.filter(s => s !== supply)
        : [...prev, supply]
    );
  }, []);

  const handleCancel = useCallback(() => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [hasChanges, navigation]);

  const handleSave = useCallback(async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a checkpoint name.');
      return;
    }

    setSaving(true);
    try {
      const updates: CheckpointUpdate = {
        name: name.trim(),
        checkpoint_type: checkpointType,
        distance_from_start: distance ? parseFloat(distance) : null,
        elevation: elevation ? parseFloat(elevation) : null,
        cutoff_time: cutoffTime.trim() || null,
        location_description: locationDescription.trim() || null,
        has_crew_access: hasCrewAccess,
        has_drop_bag: hasDropBag,
        has_pacer_pickup: hasPacerPickup,
        has_pacer_dropoff: hasPacerDropoff,
        aid_supplies: selectedSupplies,
        notes: notes.trim() || null,
      };

      updateCheckpoint(eventId, checkpointId, updates);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update checkpoint:', error);
      Alert.alert('Error', 'Failed to update checkpoint. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [
    name, checkpointType, distance, elevation, cutoffTime,
    locationDescription, hasCrewAccess, hasDropBag, hasPacerPickup,
    hasPacerDropoff, selectedSupplies, notes, eventId, checkpointId,
    updateCheckpoint, navigation
  ]);

  const typeInfo = CHECKPOINT_TYPE_INFO[checkpointType];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.parchment }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <H1>Edit Checkpoint</H1>
            <BodySmall color="secondary" style={{ marginTop: spacing.xs }}>
              {checkpoint.name}
            </BodySmall>
          </View>
        </View>

        {/* Checkpoint Type Selection */}
        <View style={styles.section}>
          <Label style={{ marginBottom: spacing.sm }}>TYPE</Label>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeScroll}
          >
            {CHECKPOINT_TYPES.map((type) => {
              const info = CHECKPOINT_TYPE_INFO[type];
              const isSelected = type === checkpointType;
              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    {
                      backgroundColor: isSelected ? info.color : colors.cream,
                      borderColor: isSelected ? info.color : colors.border,
                    },
                  ]}
                  onPress={() => setCheckpointType(type)}
                >
                  <Ionicons
                    name={info.icon as any}
                    size={20}
                    color={isSelected ? '#FFFFFF' : info.color}
                  />
                  <Text
                    variant="caption"
                    style={{
                      marginTop: 4,
                      color: isSelected ? '#FFFFFF' : colors.bark,
                    }}
                  >
                    {info.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Label style={{ marginBottom: spacing.sm }}>CHECKPOINT NAME *</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
                fontFamily: typography.body.fontFamily,
              },
            ]}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Foresthill Aid Station"
            placeholderTextColor={colors.mist}
          />
        </View>

        {/* Distance & Elevation Row */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1 }]}>
            <Label style={{ marginBottom: spacing.sm }}>DISTANCE (mi)</Label>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cream,
                  borderColor: colors.border,
                  color: colors.bark,
                  fontFamily: typography.mono.fontFamily,
                },
              ]}
              value={distance}
              onChangeText={setDistance}
              placeholder="0.0"
              placeholderTextColor={colors.mist}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={{ width: spacing.md }} />

          <View style={[styles.section, { flex: 1 }]}>
            <Label style={{ marginBottom: spacing.sm }}>ELEVATION (ft)</Label>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cream,
                  borderColor: colors.border,
                  color: colors.bark,
                  fontFamily: typography.mono.fontFamily,
                },
              ]}
              value={elevation}
              onChangeText={setElevation}
              placeholder="0"
              placeholderTextColor={colors.mist}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Cutoff Time */}
        <View style={styles.section}>
          <Label style={{ marginBottom: spacing.sm }}>CUTOFF TIME</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
                fontFamily: typography.mono.fontFamily,
              },
            ]}
            value={cutoffTime}
            onChangeText={setCutoffTime}
            placeholder="e.g., 18:00 or 6:00 PM"
            placeholderTextColor={colors.mist}
          />
          <Caption style={{ marginTop: spacing.xs }}>
            Time by which you must leave this checkpoint
          </Caption>
        </View>

        {/* Location Description */}
        <View style={styles.section}>
          <Label style={{ marginBottom: spacing.sm }}>LOCATION DESCRIPTION</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
                fontFamily: typography.body.fontFamily,
                height: 80,
                textAlignVertical: 'top',
              },
            ]}
            value={locationDescription}
            onChangeText={setLocationDescription}
            placeholder="Describe how to find this location..."
            placeholderTextColor={colors.mist}
            multiline
          />
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Label style={{ marginBottom: spacing.sm }}>FEATURES</Label>
          <Card variant="standard">
            <CardContent>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setHasCrewAccess(!hasCrewAccess)}
              >
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIcon, { backgroundColor: colors.trail + '20' }]}>
                    <Ionicons name="people" size={20} color={colors.trail} />
                  </View>
                  <View>
                    <Body>Crew Access</Body>
                    <Caption>Your support crew can meet you here</Caption>
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: hasCrewAccess ? colors.forest : 'transparent',
                      borderColor: hasCrewAccess ? colors.forest : colors.border,
                    },
                  ]}
                >
                  {hasCrewAccess && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setHasDropBag(!hasDropBag)}
              >
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIcon, { backgroundColor: colors.sunrise + '20' }]}>
                    <Ionicons name="bag-handle" size={20} color={colors.sunrise} />
                  </View>
                  <View>
                    <Body>Drop Bag</Body>
                    <Caption>You can have a drop bag delivered here</Caption>
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: hasDropBag ? colors.forest : 'transparent',
                      borderColor: hasDropBag ? colors.forest : colors.border,
                    },
                  ]}
                >
                  {hasDropBag && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setHasPacerPickup(!hasPacerPickup)}
              >
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIcon, { backgroundColor: colors.forest + '20' }]}>
                    <Ionicons name="walk" size={20} color={colors.forest} />
                  </View>
                  <View>
                    <Body>Pacer Pickup</Body>
                    <Caption>Pick up a pacer at this location</Caption>
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: hasPacerPickup ? colors.forest : 'transparent',
                      borderColor: hasPacerPickup ? colors.forest : colors.border,
                    },
                  ]}
                >
                  {hasPacerPickup && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setHasPacerDropoff(!hasPacerDropoff)}
              >
                <View style={styles.toggleLeft}>
                  <View style={[styles.toggleIcon, { backgroundColor: colors.sky + '20' }]}>
                    <Ionicons name="exit" size={20} color={colors.sky} />
                  </View>
                  <View>
                    <Body>Pacer Dropoff</Body>
                    <Caption>Drop off a pacer at this location</Caption>
                  </View>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: hasPacerDropoff ? colors.forest : 'transparent',
                      borderColor: hasPacerDropoff ? colors.forest : colors.border,
                    },
                  ]}
                >
                  {hasPacerDropoff && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>

        {/* Aid Station Supplies */}
        {(checkpointType === 'aid_station' || checkpointType === 'crew_access') && (
          <View style={styles.section}>
            <Label style={{ marginBottom: spacing.sm }}>AID STATION SUPPLIES</Label>
            <Caption style={{ marginBottom: spacing.md }}>
              Select what's typically available at this checkpoint
            </Caption>
            <View style={styles.suppliesGrid}>
              {COMMON_SUPPLIES.map((supply) => {
                const isSelected = selectedSupplies.includes(supply);
                return (
                  <TouchableOpacity
                    key={supply}
                    style={[
                      styles.supplyChip,
                      {
                        backgroundColor: isSelected ? colors.meadow + '20' : colors.cream,
                        borderColor: isSelected ? colors.meadow : colors.border,
                      },
                    ]}
                    onPress={() => toggleSupply(supply)}
                  >
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={colors.meadow}
                        style={{ marginRight: 4 }}
                      />
                    )}
                    <BodySmall style={{ color: isSelected ? colors.meadow : colors.stone }}>
                      {supply}
                    </BodySmall>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Label style={{ marginBottom: spacing.sm }}>NOTES</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
                fontFamily: typography.body.fontFamily,
                height: 100,
                textAlignVertical: 'top',
              },
            ]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any additional notes for this checkpoint..."
            placeholderTextColor={colors.mist}
            multiline
          />
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="secondary"
            onPress={handleCancel}
            style={{ marginRight: spacing.md }}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSave}
            loading={saving}
            disabled={saving || !name.trim() || !hasChanges}
            style={{ flex: 1 }}
          >
            {hasChanges ? 'Save Changes' : 'No Changes'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
  typeScroll: {
    paddingVertical: 4,
    gap: 12,
  },
  typeButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  suppliesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  supplyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
});
