import { DurationInput } from '../../components/StructuredTimeInput';
import { Alert } from 'react-native';
import { parseDateOnly, formatDateOnly } from '../../lib/dateOnly';
/**
 * UltraEdge Event Form Component
 * Shared between Create and Edit screens
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../theme';
import { Text, H3, Body, BodySmall, Label, Button } from '../../components/ui';
import { Event, EventInsert, EventStatus, DistanceUnit, ElevationUnit } from '../../lib/database.types';

// ============================================================================
// TYPES
// ============================================================================

export interface EventFormData {
  name: string;
  description: string;
  event_date: string | null;
  event_time: string | null;
  location: string;
  total_distance: string;
  distance_unit: DistanceUnit;
  total_elevation_gain: string;
  elevation_unit: ElevationUnit;
  cutoff_time: string;
  target_time: string;
  race_website: string;
  status: EventStatus;
}

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EventForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Event',
  isLoading = false,
}: EventFormProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;

  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [eventDate, setEventDate] = useState<Date | null>(
    parseDateOnly(initialData?.event_date)
  );
  const [eventTime, setEventTime] = useState(initialData?.event_time || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [totalDistance, setTotalDistance] = useState(initialData?.total_distance || '');
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(initialData?.distance_unit || 'miles');
  const [totalElevationGain, setTotalElevationGain] = useState(initialData?.total_elevation_gain || '');
  const [elevationUnit, setElevationUnit] = useState<ElevationUnit>(initialData?.elevation_unit || 'feet');
  const [cutoffTime, setCutoffTime] = useState(initialData?.cutoff_time || '');
  const [targetTime, setTargetTime] = useState(initialData?.target_time || '');
  const [raceWebsite, setRaceWebsite] = useState(initialData?.race_website || '');
  const [status, setStatus] = useState<EventStatus>(initialData?.status || 'planning');

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = () => {
    if (!name.trim()) {
      return; // Could add validation feedback
    }

    if (eventTime && !/^([01]?\d|2[0-3]):[0-5]\d$/.test(eventTime)) { Alert.alert('Invalid start time', 'Use hours 0–23 and minutes 00–59.'); return; }
    if ([cutoffTime, targetTime].some(v => v && (!/^\d{1,3}:[0-5]\d$/.test(v) || v.split(':').every(p => Number(p) === 0)))) { Alert.alert('Invalid duration', 'Enter positive hours and minutes (00–59).'); return; }
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      event_date: eventDate ? formatDateOnly(eventDate) : null,
      event_time: eventTime.trim() || null,
      location: location.trim(),
      total_distance: totalDistance,
      distance_unit: distanceUnit,
      total_elevation_gain: totalElevationGain,
      elevation_unit: elevationUnit,
      cutoff_time: cutoffTime.trim(),
      target_time: targetTime.trim(),
      race_website: raceWebsite.trim(),
      status,
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEventDate(selectedDate);
    }
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Common input styles
  const inputStyle = {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.body.fontSize,
    fontFamily: typography.body.fontFamily,
    color: colors.bark,
  };

  const inputRowStyle = {
    marginBottom: spacing.md,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl * 2 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event Name */}
        <View style={inputRowStyle}>
          <Label style={styles.label}>Event Name *</Label>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Western States 100"
            placeholderTextColor={colors.mist}
            autoCapitalize="words"
          />
        </View>

        {/* Description */}
        <View style={inputRowStyle}>
          <Label style={styles.label}>Description</Label>
          <TextInput
            style={[inputStyle, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Event notes, goals, or details..."
            placeholderTextColor={colors.mist}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Date & Time Row */}
        <View style={[styles.row, inputRowStyle]}>
          <View style={styles.halfField}>
            <Label style={styles.label}>Event Date</Label>
            <TouchableOpacity
              style={[inputStyle, styles.dateButton]}
              onPress={() => setShowDatePicker(true)}
            >
              <Body color={eventDate ? 'primary' : 'tertiary'}>
                {formatDisplayDate(eventDate)}
              </Body>
              <Ionicons name="calendar-outline" size={20} color={colors.stone} />
            </TouchableOpacity>
          </View>
          <View style={styles.halfField}>
            <Label style={styles.label}>Start Time</Label>
            <DurationInput label="Start time" value={eventTime} onChange={setEventTime} clock />
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={eventDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}

        <BodySmall style={inputRowStyle}>Start times use this device’s timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</BodySmall>
        {/* Location */}
        <View style={inputRowStyle}>
          <Label style={styles.label}>Location</Label>
          <TextInput
            style={inputStyle}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g., Squaw Valley, CA"
            placeholderTextColor={colors.mist}
          />
        </View>

        {/* Distance & Unit Row */}
        <View style={[styles.row, inputRowStyle]}>
          <View style={styles.twoThirdsField}>
            <Label style={styles.label}>Total Distance</Label>
            <TextInput
              style={inputStyle}
              value={totalDistance}
              onChangeText={setTotalDistance}
              placeholder="100"
              placeholderTextColor={colors.mist}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.thirdField}>
            <Label style={styles.label}>Unit</Label>
            <View style={[styles.unitToggle, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  { backgroundColor: distanceUnit === 'miles' ? colors.accent : colors.surface },
                  { borderTopLeftRadius: radius.sm, borderBottomLeftRadius: radius.sm },
                ]}
                onPress={() => setDistanceUnit('miles')}
              >
                <BodySmall style={{ color: distanceUnit === 'miles' ? colors.onAccent : colors.stone }}>mi</BodySmall>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  { backgroundColor: distanceUnit === 'kilometers' ? colors.accent : colors.surface },
                  { borderTopRightRadius: radius.sm, borderBottomRightRadius: radius.sm },
                ]}
                onPress={() => setDistanceUnit('kilometers')}
              >
                <BodySmall style={{ color: distanceUnit === 'kilometers' ? colors.onAccent : colors.stone }}>km</BodySmall>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Elevation & Unit Row */}
        <View style={[styles.row, inputRowStyle]}>
          <View style={styles.twoThirdsField}>
            <Label style={styles.label}>Elevation Gain</Label>
            <TextInput
              style={inputStyle}
              value={totalElevationGain}
              onChangeText={setTotalElevationGain}
              placeholder="18,000"
              placeholderTextColor={colors.mist}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.thirdField}>
            <Label style={styles.label}>Unit</Label>
            <View style={[styles.unitToggle, { borderColor: colors.border }]}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  { backgroundColor: elevationUnit === 'feet' ? colors.accent : colors.surface },
                  { borderTopLeftRadius: radius.sm, borderBottomLeftRadius: radius.sm },
                ]}
                onPress={() => setElevationUnit('feet')}
              >
                <BodySmall style={{ color: elevationUnit === 'feet' ? colors.onAccent : colors.stone }}>ft</BodySmall>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  { backgroundColor: elevationUnit === 'meters' ? colors.accent : colors.surface },
                  { borderTopRightRadius: radius.sm, borderBottomRightRadius: radius.sm },
                ]}
                onPress={() => setElevationUnit('meters')}
              >
                <BodySmall style={{ color: elevationUnit === 'meters' ? colors.onAccent : colors.stone }}>m</BodySmall>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Cutoff & Target Time Row */}
        <View style={[styles.row, inputRowStyle]}>
          <View style={styles.halfField}>
            <Label style={styles.label}>Cutoff Time</Label>
            <DurationInput label="Cutoff duration" value={cutoffTime} onChange={setCutoffTime} />
          </View>
          <View style={styles.halfField}>
            <Label style={styles.label}>Target moving time</Label>
            <DurationInput label="Target moving time" value={targetTime} onChange={setTargetTime} />
          </View>
        </View>

        {/* Race Website */}
        <View style={inputRowStyle}>
          <Label style={styles.label}>Event Website</Label>
          <TextInput
            style={inputStyle}
            value={raceWebsite}
            onChangeText={setRaceWebsite}
            placeholder="https://..."
            placeholderTextColor={colors.mist}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Status */}
        <View style={inputRowStyle}>
          <Label style={styles.label}>Status</Label>
          <View style={styles.statusRow}>
            {(['draft', 'planning', 'ready'] as EventStatus[]).map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.statusChip,
                  { 
                    backgroundColor: status === s ? colors.accent : colors.cream,
                    borderColor: status === s ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setStatus(s)}
              >
                <BodySmall style={{ color: status === s ? colors.onAccent : colors.stone }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </BodySmall>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={[styles.actions, { marginTop: spacing.lg }]}>
          <Button
            variant="secondary"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button
            onPress={handleSubmit}
            loading={isLoading}
            disabled={!name.trim()}
            style={styles.submitButton}
          >
            {submitLabel}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

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
  label: {
    marginBottom: 6,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  twoThirdsField: {
    flex: 2,
  },
  thirdField: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});

export default EventForm;
