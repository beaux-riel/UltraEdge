/**
 * UltraEdge Events List Screen
 * List all events with swipe to delete
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../theme';
import { 
  H1, 
  H3, 
  Body, 
  BodySmall, 
  Caption,
  Button, 
  Card, 
  CardContent 
} from '../../components/ui';
import { useEvents } from '../../context/EventContext';
import { Event, EventStatus } from '../../lib/database.types';

type Props = NativeStackScreenProps<any, 'EventsList'>;

export default function EventsListScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();
  const { events, loading, refreshEvents, deleteEvent } = useEvents();

  const [refreshing, setRefreshing] = useState(false);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshEvents();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshEvents();
    setRefreshing(false);
  };

  // Handle delete with confirmation
  const handleDelete = (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(event.id),
        },
      ]
    );
  };

  // Format date for display
  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate days until event
  const getDaysUntil = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get status badge color
  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case 'draft':
        return colors.mist;
      case 'planning':
        return colors.trail;
      case 'ready':
        return colors.meadow;
      case 'in_progress':
        return colors.sunrise;
      case 'completed':
        return colors.forest;
      case 'cancelled':
        return colors.clay;
      default:
        return colors.mist;
    }
  };

  // Render swipeable delete action
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
    event: Event
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={() => handleDelete(event)}
        style={[styles.deleteAction, { backgroundColor: colors.clay }]}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color={colors.snow} />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Render event card
  const renderEventCard = ({ item: event }: { item: Event }) => {
    const daysUntil = getDaysUntil(event.event_date);

    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, event)
        }
        friction={2}
        rightThreshold={40}
      >
        <Card
          variant="standard"
          onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
          style={styles.eventCard}
        >
          <CardContent>
            <View style={styles.eventHeader}>
              <View style={{ flex: 1 }}>
                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(event.status) + '20' },
                  ]}
                >
                  <Caption style={{ color: getStatusColor(event.status), fontWeight: '600' }}>
                    {event.status.toUpperCase().replace('_', ' ')}
                  </Caption>
                </View>

                {/* Event Name */}
                <H3 style={{ marginTop: spacing.xs }}>{event.name}</H3>

                {/* Date & Location */}
                <BodySmall color="secondary" style={{ marginTop: 2 }}>
                  {formatEventDate(event.event_date)}
                </BodySmall>
                {event.location && (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.stone} />
                    <BodySmall color="secondary" style={{ marginLeft: 4 }}>
                      {event.location}
                    </BodySmall>
                  </View>
                )}
              </View>

              {/* Countdown */}
              {daysUntil !== null && daysUntil > 0 && (
                <View style={[styles.countdown, { backgroundColor: colors.forest + '15' }]}>
                  <H3 style={{ color: colors.forest }}>{daysUntil}</H3>
                  <Caption style={{ color: colors.forest }}>days</Caption>
                </View>
              )}
            </View>

            {/* Event Stats */}
            <View style={styles.eventStats}>
              {event.total_distance && (
                <View style={styles.eventStat}>
                  <Ionicons name="navigate-outline" size={14} color={colors.stone} />
                  <BodySmall color="secondary" style={{ marginLeft: 4 }}>
                    {event.total_distance} {event.distance_unit}
                  </BodySmall>
                </View>
              )}
              {event.total_elevation_gain && (
                <View style={styles.eventStat}>
                  <Ionicons name="trending-up-outline" size={14} color={colors.stone} />
                  <BodySmall color="secondary" style={{ marginLeft: 4 }}>
                    {event.total_elevation_gain.toLocaleString()} {event.elevation_unit}
                  </BodySmall>
                </View>
              )}
              {event.target_time && (
                <View style={styles.eventStat}>
                  <Ionicons name="timer-outline" size={14} color={colors.stone} />
                  <BodySmall color="secondary" style={{ marginLeft: 4 }}>
                    {event.target_time}
                  </BodySmall>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </Swipeable>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trail-sign-outline" size={64} color={colors.mist} />
      <H3 color="secondary" style={{ marginTop: spacing.md }}>
        No Events Yet
      </H3>
      <Body color="tertiary" align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
        Create your first event to start planning your next adventure.
      </Body>
      <Button
        onPress={() => navigation.navigate('CreateEvent')}
        style={{ marginTop: spacing.lg }}
      >
        Create Event
      </Button>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
              name="calendar"
              size={28}
              color={colors.forest}
              style={{ marginRight: spacing.sm }}
            />
            <H1>Events</H1>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateEvent')}
            style={[styles.addButton, { backgroundColor: colors.forest }]}
          >
            <Ionicons name="add" size={24} color={colors.snow} />
          </TouchableOpacity>
        </View>

        {/* Events List */}
        <FlatList
          data={events}
          renderItem={renderEventCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            events.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.forest}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        />
      </View>
    </GestureHandlerRootView>
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventCard: {
    marginBottom: 0,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  countdown: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  eventStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
    flexWrap: 'wrap',
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
});
