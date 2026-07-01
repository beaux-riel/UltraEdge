/**
 * UltraEdge Edit Event Screen
 * Edit an existing event
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { H1, Body, Button } from '../../components/ui';
import { useEvents } from '../../context/EventContext';
import { EventForm, EventFormData } from './EventForm';

type Props = NativeStackScreenProps<any, 'EditEvent'>;

export default function EditEventScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const { getEvent, updateEvent } = useEvents();

  const eventId = route.params?.eventId;
  const event = getEvent(eventId);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // If event not found, show error
  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <View style={[styles.centered, { paddingTop: insets.top + 100 }]}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.mist} />
          <Body color="secondary" style={{ marginTop: spacing.md }}>
            Event not found
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

  // Convert event to form data
  const initialFormData: Partial<EventFormData> = {
    name: event.name,
    description: event.description || '',
    event_date: event.event_date,
    event_time: event.event_time || '',
    location: event.location || '',
    total_distance: event.total_distance?.toString() || '',
    distance_unit: event.distance_unit,
    total_elevation_gain: event.total_elevation_gain?.toString() || '',
    elevation_unit: event.elevation_unit,
    cutoff_time: event.cutoff_time || '',
    target_time: event.target_time || '',
    race_website: event.race_website || '',
    status: event.status,
  };

  const handleSubmit = async (formData: EventFormData) => {
    try {
      setIsSubmitting(true);

      await updateEvent(eventId, {
        name: formData.name,
        description: formData.description || null,
        event_date: formData.event_date,
        event_time: formData.event_time,
        location: formData.location || null,
        total_distance: formData.total_distance ? parseFloat(formData.total_distance) : null,
        distance_unit: formData.distance_unit,
        total_elevation_gain: formData.total_elevation_gain ? parseInt(formData.total_elevation_gain, 10) : null,
        elevation_unit: formData.elevation_unit,
        cutoff_time: formData.cutoff_time || null,
        target_time: formData.target_time || null,
        status: formData.status,
        race_website: formData.race_website || null,
      });

      // Navigate back to detail screen
      navigation.goBack();
    } catch (error) {
      console.error('Failed to update event:', error);
      Alert.alert(
        'Error',
        'Failed to update event. Please try again.',
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
            name="create-outline"
            size={28}
            color={colors.trail}
            style={{ marginRight: spacing.sm }}
          />
          <H1>Edit Event</H1>
        </View>
      </View>

      {/* Form */}
      <EventForm
        initialData={initialFormData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        submitLabel="Save Changes"
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
