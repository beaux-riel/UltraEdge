/**
 * UltraEdge Create Event Screen
 * Form to create a new event
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { H1 } from '../../components/ui';
import { useEvents } from '../../context/EventContext';
import { EventForm, EventFormData } from './EventForm';

type Props = NativeStackScreenProps<any, 'CreateEvent'>;

export default function CreateEventScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const { createEvent } = useEvents();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: EventFormData) => {
    try {
      setIsSubmitting(true);

      const event = await createEvent({
        name: formData.name,
        description: formData.description || null,
        event_date: formData.event_date,
        event_time: formData.event_time,
        location: formData.location || null,
        total_distance: formData.total_distance ? parseFloat(formData.total_distance) : null,
        distance_unit: formData.distance_unit,
        total_elevation_gain: formData.total_elevation_gain ? parseInt(formData.total_elevation_gain, 10) : null,
        total_elevation_loss: null,
        elevation_unit: formData.elevation_unit,
        cutoff_time: formData.cutoff_time || null,
        target_time: formData.target_time || null,
        status: formData.status,
        race_website: formData.race_website || null,
        start_location: null,
        finish_location: null,
        mover_weight_snapshot: null,
        total_gear_weight: null,
        total_nutrition_weight: null,
        total_hydration_weight: null,
        course_map_url: null,
        gpx_file_url: null,
      });

      // Navigate to the new event's detail screen
      navigation.replace('EventDetail', { eventId: event.id });
    } catch (error) {
      console.error('Failed to create event:', error);
      Alert.alert(
        'Error',
        'Failed to create event. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.sm,
            backgroundColor: colors.parchment,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="trail-sign"
            size={28}
            color={colors.forest}
            style={{ marginRight: spacing.sm }}
          />
          <H1>New Event</H1>
        </View>
      </View>

      {/* Form */}
      <EventForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Create Event"
        isLoading={isSubmitting}
      />
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
