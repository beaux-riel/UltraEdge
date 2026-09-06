import { parseDateOnly, daysUntilDate } from '../../lib/dateOnly';
/**
 * UltraEdge Event Detail Screen
 * View a single event with all details, checkpoints, gear, and crew
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Linking,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';

import { useTheme } from '../../theme';
import { 
  Text, 
  H1, 
  H2, 
  H3, 
  Body, 
  BodySmall, 
  Caption,
  Button, 
  Card, 
  CardContent 
} from '../../components/ui';
import { useEvents } from '../../context/EventContext';
import { useCheckpoints, CHECKPOINT_TYPE_INFO } from '../../context/CheckpointContext';
import { useGear, GearItem } from '../../context/GearContext';
import { useCrewMembers, CrewMember, ROLE_CONFIG } from '../../context/CrewContext';
import { useDropBags } from '../../context/DropBagContext';
import { Event, EventStatus, EventUpdate, Checkpoint } from '../../lib/database.types';
import { EVENT_CREW_KEY, EventCrewAssignment, removeEventCrewAssignment } from '../../lib/eventCrew';
import { runLocalPlanOperation, readArray } from '../../lib/localPlanStorage';
import { removeEventGear } from '../../lib/eventGear';
import { eventStatsFromRoute } from '../../lib/gpx';
import GPXRouteSection from '../../components/gpx/GPXRouteSection';
import ExportRacePlanButton from '../../components/ExportRacePlanButton';

type Props = NativeStackScreenProps<any, 'EventDetail'>;

// Storage key for event gear relationships
const EVENT_GEAR_KEY = '@ultraedge/event-gear';

// Types for event relationships
interface EventGearAllocation {
  eventId: string;
  gearItemId: string;
  isWorn: boolean;
  isCarried: boolean;
  quantity: number;
  notes?: string;
}

export default function EventDetailScreen({ navigation, route }: Props) {
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  
  // Contexts
  const { getEvent, updateEvent, deleteEvent, refreshEvents } = useEvents();
  const { getCheckpointsByEventId, deleteCheckpoint, getCheckpointById } = useCheckpoints();
  const { gearItems, getGearItem } = useGear();
  const { crewMembers, getCrewMember } = useCrewMembers();
  const { getDropBagsByEvent } = useDropBags();

  const eventId = route.params?.eventId;
  const event = getEvent(eventId);
  const eventDropBags = getDropBagsByEvent(eventId);

  const [refreshing, setRefreshing] = useState(false);
  
  // Local state for event relationships
  const [eventGear, setEventGear] = useState<EventGearAllocation[]>([]);
  const [eventCrew, setEventCrew] = useState<EventCrewAssignment[]>([]);

  // Load event relationships from AsyncStorage
  const loadRelationships = useCallback(async () => {
    try {
      const [allGear, allCrew] = await runLocalPlanOperation(() => Promise.all([
        readArray<EventGearAllocation>(EVENT_GEAR_KEY),
        readArray<EventCrewAssignment>(EVENT_CREW_KEY),
      ]));
      setEventGear(allGear.filter(g => g.eventId === eventId));
      setEventCrew(allCrew.filter(c => c.eventId === eventId));
    } catch (error) {
      Alert.alert('Plan unavailable', 'Gear and crew could not be loaded. Pull to refresh before relying on this plan.');
    }
  }, [eventId]);

  // Get checkpoints for this event
  const checkpoints = getCheckpointsByEventId(eventId);

  // Get gear items for this event
  const eventGearItems = eventGear
    .map(eg => ({ allocation: eg, item: getGearItem(eg.gearItemId) }))
    .filter((g): g is { allocation: EventGearAllocation; item: GearItem } => g.item !== undefined);

  // Get crew members for this event
  const eventCrewMembers = eventCrew
    .map(ec => ({ assignment: ec, member: getCrewMember(ec.crewMemberId) }))
    .filter((c): c is { assignment: EventCrewAssignment; member: CrewMember } => c.member !== undefined);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshEvents();
      loadRelationships();
    }, [loadRelationships])
  );

  useFocusEffect(useCallback(() => {
    StatusBar.setBarStyle('light-content', true);
    return () => StatusBar.setBarStyle(isDarkMode ? 'light-content' : 'dark-content', true);
  }, [isDarkMode]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshEvents(), loadRelationships()]);
    setRefreshing(false);
  };

  // Handle delete checkpoint
  const handleDeleteCheckpoint = (checkpoint: Checkpoint) => {
    Alert.alert(
      'Delete Checkpoint',
      `Are you sure you want to delete "${checkpoint.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try { await deleteCheckpoint(eventId, checkpoint.id); }
            catch { Alert.alert('Not deleted', 'The checkpoint could not be deleted. Please try again.'); }
          },
        },
      ]
    );
  };

  // Handle remove gear from event
  const handleRemoveGear = async (gearItemId: string, gearName: string) => {
    Alert.alert(
      'Remove Gear',
      `Remove "${gearName}" from this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await removeEventGear(eventId, gearItemId);
              setEventGear(updated.filter(g => g.eventId === eventId));
            } catch (error) {
              Alert.alert('Not removed', 'Gear could not be removed. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle unassign crew from event
  const handleUnassignCrew = async (crewMemberId: string, crewName: string) => {
    Alert.alert(
      'Unassign Crew',
      `Remove "${crewName}" from this event?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = await removeEventCrewAssignment(eventId, crewMemberId);
              setEventCrew(updated.filter(c => c.eventId === eventId));
            } catch (error) {
              Alert.alert('Not removed', 'Crew could not be unassigned. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle delete event
  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (await deleteEvent(eventId)) navigation.goBack();
              else Alert.alert('Not deleted', 'The event could not be deleted. Please refresh and try again.');
            } catch {
              Alert.alert('Not deleted', 'The event could not be deleted. Please refresh and try again.');
            }
          },
        },
      ]
    );
  };

  // Open race website
  const openRaceWebsite = async () => {
    if (!event?.race_website) return;
    
    let url = event.race_website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open this URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link');
    }
  };

  // Navigate to add gear with selection
  const handleAddGear = () => {
    // Show action sheet to add existing or create new
    Alert.alert(
      'Add Gear',
      'How would you like to add gear?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Existing',
          onPress: () => navigation.navigate('SelectGear', { eventId }),
        },
        {
          text: 'Create New',
          onPress: () => navigation.navigate('CreateGear', { eventId }),
        },
      ]
    );
  };

  // Navigate to add crew with selection
  const handleAddCrew = () => {
    Alert.alert(
      'Add Crew',
      'How would you like to add crew?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Existing',
          onPress: () => navigation.navigate('SelectCrew', { eventId }),
        },
        {
          text: 'Create New',
          onPress: () => navigation.navigate('CreateCrew', { eventId }),
        },
      ]
    );
  };

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

  // Format date for display
  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    const date = parseDateOnly(dateStr);
    if (!date) return 'Date TBD';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Calculate days to the start line
  const getDaysUntil = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    return daysUntilDate(dateStr);
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

  const daysUntil = getDaysUntil(event.event_date);

  // Render swipe delete action
  const renderDeleteAction = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.deleteAction, { backgroundColor: colors.clay }]}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={22} color={colors.snow} />
        </Animated.View>
      </View>
    );
  };

  // Render checkpoint item
  const renderCheckpointItem = (checkpoint: Checkpoint, index: number) => {
    const typeInfo = CHECKPOINT_TYPE_INFO[checkpoint.checkpoint_type];
    
    return (
      <Swipeable
        key={checkpoint.id}
        renderRightActions={(progress, dragX) => renderDeleteAction(progress, dragX)}
        onSwipeableOpen={() => handleDeleteCheckpoint(checkpoint)}
        friction={2}
        rightThreshold={60}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('CheckpointDetail', { 
            eventId, 
            checkpointId: checkpoint.id 
          })}
          style={[
            styles.listItem,
            { 
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              borderBottomWidth: index < checkpoints.length - 1 ? 1 : 0,
            }
          ]}
        >
          <View style={[styles.listItemIcon, { backgroundColor: typeInfo.color + '20' }]}>
            <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
          </View>
          <View style={styles.listItemContent}>
            <Body numberOfLines={1}>{checkpoint.name}</Body>
            <BodySmall color="tertiary">
              {typeInfo.label}
              {checkpoint.distance_from_start != null ? ` • ${checkpoint.distance_from_start.toLocaleString('en-US', { maximumFractionDigits: 1 })} mi` : ''}
            </BodySmall>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.stone} />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Render gear item
  const renderGearItem = (
    { allocation, item }: { allocation: EventGearAllocation; item: GearItem },
    index: number
  ) => {
    return (
      <Swipeable
        key={item.id}
        renderRightActions={(progress, dragX) => renderDeleteAction(progress, dragX)}
        onSwipeableOpen={() => handleRemoveGear(item.id, item.name)}
        friction={2}
        rightThreshold={60}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('GearDetail', { gearId: item.id })}
          style={[
            styles.listItem,
            { 
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              borderBottomWidth: index < eventGearItems.length - 1 ? 1 : 0,
            }
          ]}
        >
          <View style={[styles.listItemIcon, { backgroundColor: colors.trail + '20' }]}>
            <Ionicons name="cube-outline" size={18} color={colors.trail} />
          </View>
          <View style={styles.listItemContent}>
            <Body numberOfLines={1}>{item.name}</Body>
            <BodySmall color="tertiary">
              {item.brand || item.category}
              {item.weight ? ` • ${item.weight} ${item.weightUnit}` : ''}
            </BodySmall>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.stone} />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Render crew member item
  const renderCrewItem = (
    { assignment, member }: { assignment: EventCrewAssignment; member: CrewMember },
    index: number
  ) => {
    const roles = assignment.roles ?? [];
    const primaryRoleInfo = roles.length > 0 ? ROLE_CONFIG[roles[0]] : null;
    const iconColor = primaryRoleInfo?.color ?? colors.trail;

    return (
      <Swipeable
        key={member.id}
        renderRightActions={(progress, dragX) => renderDeleteAction(progress, dragX)}
        onSwipeableOpen={() => handleUnassignCrew(member.id, member.name)}
        friction={2}
        rightThreshold={60}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate('CrewDetail', { crewId: member.id })}
          style={[
            styles.listItem,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              borderBottomWidth: index < eventCrewMembers.length - 1 ? 1 : 0,
            }
          ]}
        >
          <View style={[styles.listItemIcon, { backgroundColor: iconColor + '20' }]}>
            <Ionicons
              name={(primaryRoleInfo?.icon as any) ?? 'person'}
              size={18}
              color={iconColor}
            />
          </View>
          <View style={styles.listItemContent}>
            <Body numberOfLines={1}>{member.name}</Body>
            {roles.length > 0 ? (
              <View style={styles.crewRoleChips}>
                {roles.map(role => {
                  const config = ROLE_CONFIG[role];
                  const label =
                    role === 'other' && assignment.customRole
                      ? assignment.customRole
                      : config.label;
                  return (
                    <View
                      key={role}
                      style={[styles.crewRoleChip, { backgroundColor: config.color + '20' }]}
                    >
                      <Text
                        variant="caption"
                        style={{ color: config.color }}
                      >
                        {label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <BodySmall color="tertiary">
                {member.phone || 'No roles set'}
              </BodySmall>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.stone} />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.forest}
            />
          }
        >
          {/* Hero Header */}
          <View style={[styles.hero, { backgroundColor: colors.hero, paddingTop: insets.top + spacing.md }]}>
            {/* Navigation */}
            <View style={styles.heroNav}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.navButton}
                accessibilityRole="button" accessibilityLabel="Back"
              >
                <Ionicons name="arrow-back" size={24} color={colors.snow} />
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditEvent', { eventId })}
                  accessibilityRole="button" accessibilityLabel="Edit race plan"
                  style={styles.navButton}
                >
                  <Ionicons name="pencil" size={22} color={colors.snow} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  accessibilityRole="button" accessibilityLabel="Delete event"
                  style={styles.navButton}
                >
                  <Ionicons name="trash-outline" size={22} color={colors.snow} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Event Title & Badge */}
            <View style={styles.heroContent}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: 'rgba(255,255,255,0.08)' },
                ]}
              >
                <Caption style={{ color: colors.accent, fontWeight: '700', letterSpacing: 1.4 }}>
                  {event.status.toUpperCase().replace('_', ' ')}
                </Caption>
              </View>
              <Caption style={{ color: colors.heroText, letterSpacing: 2, marginTop: spacing.lg }}>RACE FIELD GUIDE</Caption>
              <H1 style={{ color: colors.heroText, marginTop: spacing.sm, fontSize: fontScale > 1.5 ? 26 : 36, lineHeight: fontScale > 1.5 ? 31 : 40 }}>{event.name}</H1>
              <BodySmall style={{ color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs }}>
                {formatEventDate(event.event_date)}
                {event.event_time && ` • ${event.event_time}`}
              </BodySmall>
              {event.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color="rgba(255,255,255,0.7)" />
                  <BodySmall style={{ color: 'rgba(255,255,255,0.8)', marginLeft: 4 }}>
                    {event.location}
                  </BodySmall>
                </View>
              )}
            </View>

            {/* Countdown */}
            {daysUntil !== null && daysUntil > 0 && (
              <View style={[styles.countdown, { borderTopColor: 'rgba(255,255,255,0.16)' }]}>
                <Text variant="h2" style={{ color: colors.accent }}>
                  {daysUntil}
                </Text>
                <BodySmall style={{ color: 'rgba(255,255,255,0.8)' }}>
                  days to the start line
                </BodySmall>
              </View>
            )}
          </View>

          {/* Measured course figures, kept separate from preparation status. */}
          <View style={styles.content}>
            <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
              {[
                { label: 'DISTANCE', value: event.total_distance == null ? '—' : event.total_distance.toLocaleString('en-US', { maximumFractionDigits: 1 }), unit: event.distance_unit === 'kilometers' ? 'km' : 'mi' },
                { label: 'ASCENT', value: event.total_elevation_gain == null ? '—' : event.total_elevation_gain.toLocaleString('en-US', { maximumFractionDigits: 0 }), unit: event.elevation_unit === 'meters' ? 'm' : 'ft' },
                { label: 'TARGET', value: event.target_time || '—', unit: 'time' },
              ].map(stat => (
                <View key={stat.label} style={[styles.statCard, { minWidth: 85 * fontScale }]}>
                  <Caption style={{ letterSpacing: 1, fontSize: 10 }}>{stat.label}</Caption>
                  <Text variant="h2" style={{ marginTop: spacing.xs, fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] }}>{stat.value}</Text>
                  <Caption>{stat.unit}</Caption>
                </View>
              ))}
            </View>

            {/* Course Route (GPX) */}
            <GPXRouteSection
              eventId={eventId}
              gpxFileUrl={event.gpx_file_url}
              onGpxChange={async (fileUri, stats) => {
                const updates: EventUpdate = { gpx_file_url: fileUri };
                if (stats) {
                  Object.assign(
                    updates,
                    eventStatsFromRoute(stats, event.distance_unit, event.elevation_unit)
                  );
                }
                if (!await updateEvent(eventId, updates)) {
                  throw new Error('The event is no longer available. Refresh before importing a route.');
                }
              }}
            />

            {/* Description */}
            {event.description && (
              <Card style={styles.section}>
                <CardContent>
                  <H3>About</H3>
                  <Body color="secondary" style={{ marginTop: spacing.xs }}>
                    {event.description}
                  </Body>
                </CardContent>
              </Card>
            )}

            {/* Cutoff Time */}
            {event.cutoff_time && (
              <Card style={styles.section}>
                <CardContent>
                  <View style={styles.infoRow}>
                    <View style={styles.infoItem}>
                      <Caption>Cutoff Time</Caption>
                      <Text variant="h3">{event.cutoff_time}</Text>
                    </View>
                    {event.target_time && (
                      <View style={styles.infoItem}>
                        <Caption>Target Time</Caption>
                        <Text variant="h3">{event.target_time}</Text>
                      </View>
                    )}
                  </View>
                </CardContent>
              </Card>
            )}

            {/* Race Website Link */}
            {event.race_website && (
              <TouchableOpacity onPress={openRaceWebsite}>
                <Card style={styles.section}>
                  <CardContent>
                    <View style={styles.linkRow}>
                      <Ionicons name="globe-outline" size={20} color={colors.sky} />
                      <Body 
                        color="secondary" 
                        style={{ marginLeft: spacing.sm, flex: 1 }} 
                        numberOfLines={1}
                      >
                        {event.race_website}
                      </Body>
                      <Ionicons name="open-outline" size={18} color={colors.sky} />
                    </View>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            )}

            {/* Race Plan Export */}
            <ExportRacePlanButton
              eventId={eventId}
              fullWidth
              style={{ marginBottom: theme.spacing.lg }}
            />

            {/* Checkpoints Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <H2>Checkpoints</H2>
                <Button
                  variant="tertiary"
                  size="sm"
                  onPress={() => navigation.navigate('CreateCheckpoint', { eventId })}
                >
                  Add
                </Button>
              </View>
              {checkpoints.length > 0 ? (
                <Card style={{ overflow: 'hidden' }}>
                  {checkpoints.map((cp, index) => renderCheckpointItem(cp, index))}
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <View style={styles.emptySection}>
                      <Ionicons name="flag-outline" size={40} color={colors.mist} />
                      <BodySmall color="tertiary" align="center" style={{ marginTop: spacing.sm }}>
                        No checkpoints added yet.{'\n'}Add aid stations, crew access points, and more.
                      </BodySmall>
                    </View>
                  </CardContent>
                </Card>
              )}
            </View>

            {/* Gear Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <H2>Gear</H2>
                <Button
                  variant="tertiary"
                  size="sm"
                  onPress={handleAddGear}
                >
                  Add
                </Button>
              </View>
              {eventGearItems.length > 0 ? (
                <Card style={{ overflow: 'hidden' }}>
                  {eventGearItems.map((g, index) => renderGearItem(g, index))}
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <View style={styles.emptySection}>
                      <Ionicons name="cube-outline" size={40} color={colors.mist} />
                      <BodySmall color="tertiary" align="center" style={{ marginTop: spacing.sm }}>
                        No gear assigned to this event.{'\n'}Track what you'll wear and carry.
                      </BodySmall>
                    </View>
                  </CardContent>
                </Card>
              )}
            </View>

            {/* Crew Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <H2>Crew</H2>
                <Button
                  variant="tertiary"
                  size="sm"
                  onPress={handleAddCrew}
                >
                  Add
                </Button>
              </View>
              {eventCrewMembers.length > 0 ? (
                <Card style={{ overflow: 'hidden' }}>
                  {eventCrewMembers.map((c, index) => renderCrewItem(c, index))}
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <View style={styles.emptySection}>
                      <Ionicons name="people-outline" size={40} color={colors.mist} />
                      <BodySmall color="tertiary" align="center" style={{ marginTop: spacing.sm }}>
                        No crew members assigned.{'\n'}Add your support team.
                      </BodySmall>
                    </View>
                  </CardContent>
                </Card>
              )}
            </View>

            {/* Drop Bags Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <H2>Drop Bags</H2>
                <Button
                  variant="tertiary"
                  size="sm"
                  onPress={() => navigation.navigate('CreateDropBag', { eventId })}
                >
                  Add
                </Button>
              </View>
              {eventDropBags.length > 0 ? (
                <Card>
                  <CardContent>
                    {eventDropBags.map((bag, index) => {
                      const checkpoint = bag.checkpointId 
                        ? getCheckpointById(eventId, bag.checkpointId) 
                        : null;
                      return (
                        <TouchableOpacity
                          key={bag.id}
                          style={[
                            styles.dropBagItem,
                            index > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight },
                          ]}
                          onPress={() => navigation.navigate('DropBagDetail', { dropBagId: bag.id })}
                        >
                          <View style={[styles.dropBagIcon, { backgroundColor: colors.sunrise + '20' }]}>
                            <Ionicons name="bag-handle" size={20} color={colors.sunrise} />
                          </View>
                          <View style={styles.dropBagInfo}>
                            <Text variant="body">{bag.name}</Text>
                            <BodySmall color="tertiary">
                              {checkpoint ? checkpoint.name : 'No checkpoint'} • {bag.items.length} items
                            </BodySmall>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={colors.mist} />
                        </TouchableOpacity>
                      );
                    })}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent>
                    <View style={styles.emptySection}>
                      <Ionicons name="bag-handle-outline" size={40} color={colors.mist} />
                      <BodySmall color="tertiary" align="center" style={{ marginTop: spacing.sm }}>
                        No drop bags created yet.{'\n'}Plan what gear goes where.
                      </BodySmall>
                    </View>
                  </CardContent>
                </Card>
              )}
            </View>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 8,
  },
  heroContent: {
    marginTop: 16,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  statCard: {
    flex: 1,
    minWidth: 85,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  listItemInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 24,
  },
  infoItem: {
    flex: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
    marginRight: 8,
  },
  crewRoleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  crewRoleChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deleteAction: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropBagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  dropBagIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropBagInfo: {
    flex: 1,
  },
});
