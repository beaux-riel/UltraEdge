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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
import { Event, EventStatus, Checkpoint } from '../../lib/database.types';

type Props = NativeStackScreenProps<any, 'EventDetail'>;

// Storage keys for event relationships
const EVENT_GEAR_KEY = '@ultraedge/event-gear';
const EVENT_CREW_KEY = '@ultraedge/event-crew';

// Types for event relationships
interface EventGearAllocation {
  eventId: string;
  gearItemId: string;
  isWorn: boolean;
  isCarried: boolean;
  quantity: number;
  notes?: string;
}

interface EventCrewAssignment {
  eventId: string;
  crewMemberId: string;
  notes?: string;
}

export default function EventDetailScreen({ navigation, route }: Props) {
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();
  
  // Contexts
  const { getEvent, deleteEvent, refreshEvents } = useEvents();
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
      const [gearData, crewData] = await Promise.all([
        AsyncStorage.getItem(EVENT_GEAR_KEY),
        AsyncStorage.getItem(EVENT_CREW_KEY),
      ]);
      
      if (gearData) {
        const allGear: EventGearAllocation[] = JSON.parse(gearData);
        setEventGear(allGear.filter(g => g.eventId === eventId));
      }
      
      if (crewData) {
        const allCrew: EventCrewAssignment[] = JSON.parse(crewData);
        setEventCrew(allCrew.filter(c => c.eventId === eventId));
      }
    } catch (error) {
      console.error('Failed to load event relationships:', error);
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
          onPress: () => deleteCheckpoint(eventId, checkpoint.id),
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
              const stored = await AsyncStorage.getItem(EVENT_GEAR_KEY);
              const allGear: EventGearAllocation[] = stored ? JSON.parse(stored) : [];
              const updated = allGear.filter(g => !(g.eventId === eventId && g.gearItemId === gearItemId));
              await AsyncStorage.setItem(EVENT_GEAR_KEY, JSON.stringify(updated));
              setEventGear(updated.filter(g => g.eventId === eventId));
            } catch (error) {
              console.error('Failed to remove gear:', error);
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
              const stored = await AsyncStorage.getItem(EVENT_CREW_KEY);
              const allCrew: EventCrewAssignment[] = stored ? JSON.parse(stored) : [];
              const updated = allCrew.filter(c => !(c.eventId === eventId && c.crewMemberId === crewMemberId));
              await AsyncStorage.setItem(EVENT_CREW_KEY, JSON.stringify(updated));
              setEventCrew(updated.filter(c => c.eventId === eventId));
            } catch (error) {
              console.error('Failed to unassign crew:', error);
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
            await deleteEvent(eventId);
            navigation.goBack();
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
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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
          <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
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
              {checkpoint.distance_from_start ? ` • ${checkpoint.distance_from_start} mi` : ''}
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
    const roleInfo = ROLE_CONFIG[member.role];
    
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
          <View style={[styles.listItemIcon, { backgroundColor: roleInfo.color + '20' }]}>
            <Ionicons name={roleInfo.icon as any} size={18} color={roleInfo.color} />
          </View>
          <View style={styles.listItemContent}>
            <Body numberOfLines={1}>{member.name}</Body>
            <BodySmall color="tertiary">
              {member.customRole || roleInfo.label}
              {member.phone ? ` • ${member.phone}` : ''}
            </BodySmall>
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
          <LinearGradient
            colors={isDarkMode 
              ? [colors.forest, colors.parchment] 
              : [colors.forest, '#4A8B5C', colors.parchment]
            }
            style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
          >
            {/* Navigation */}
            <View style={styles.heroNav}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.navButton}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('EditEvent', { eventId })}
                  style={styles.navButton}
                >
                  <Ionicons name="pencil" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={styles.navButton}
                >
                  <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Event Title & Badge */}
            <View style={styles.heroContent}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(event.status) + '30' },
                ]}
              >
                <Caption style={{ color: getStatusColor(event.status), fontWeight: '600' }}>
                  {event.status.toUpperCase().replace('_', ' ')}
                </Caption>
              </View>
              <H1 style={{ color: '#FFFFFF', marginTop: spacing.xs }}>{event.name}</H1>
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
              <View style={styles.countdown}>
                <Text variant="display" style={{ color: '#FFFFFF' }}>
                  {daysUntil}
                </Text>
                <BodySmall style={{ color: 'rgba(255,255,255,0.8)' }}>
                  days until event
                </BodySmall>
              </View>
            )}
          </LinearGradient>

          {/* Stats Cards */}
          <View style={[styles.content, { marginTop: -spacing.xl }]}>
            <View style={styles.statsRow}>
              {/* Distance */}
              <Card variant="elevated" style={styles.statCard}>
                <CardContent>
                  <Ionicons name="navigate-outline" size={24} color={colors.forest} />
                  <Text variant="h2" style={{ marginTop: spacing.xs }}>
                    {event.total_distance || '—'}
                  </Text>
                  <Caption>{event.distance_unit}</Caption>
                </CardContent>
              </Card>

              {/* Elevation */}
              <Card variant="elevated" style={styles.statCard}>
                <CardContent>
                  <Ionicons name="trending-up-outline" size={24} color={colors.trail} />
                  <Text variant="h2" style={{ marginTop: spacing.xs }}>
                    {event.total_elevation_gain?.toLocaleString() || '—'}
                  </Text>
                  <Caption>{event.elevation_unit}</Caption>
                </CardContent>
              </Card>

              {/* Time */}
              <Card variant="elevated" style={styles.statCard}>
                <CardContent>
                  <Ionicons name="timer-outline" size={24} color={colors.sunrise} />
                  <Text variant="h2" style={{ marginTop: spacing.xs }}>
                    {event.target_time || '—'}
                  </Text>
                  <Caption>target</Caption>
                </CardContent>
              </Card>
            </View>

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
    paddingBottom: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    padding: 8,
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
    alignItems: 'center',
    marginTop: 24,
  },
  content: {
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
    marginRight: 8,
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
