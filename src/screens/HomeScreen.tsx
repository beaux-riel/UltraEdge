/**
 * UltraEdge Home Screen
 * Dashboard with upcoming events and quick stats
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme';
import { Text, H1, H2, H3, Body, BodySmall, Button, Card, CardContent, WeightBadge } from '../components/ui';
import { useEvents } from '../context/EventContext';
import { useMover } from '../context/MoverContext';
import type { Event, Mover } from '../lib/database.types';

export default function HomeScreen({ navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();

  // Use local-first contexts
  const { events, loading: eventsLoading, refreshEvents } = useEvents();
  const { profile: mover, isLoading: moverLoading } = useMover();
  
  const [refreshing, setRefreshing] = useState(false);
  const loading = eventsLoading || moverLoading;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshEvents();
    setRefreshing(false);
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Format date for display
  const formatEventDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate days until event
  const getDaysUntil = (dateStr: string | null) => {
    if (!dateStr) return null;
    const eventDate = new Date(dateStr);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.parchment }]}
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
      {/* Header */}
      <LinearGradient
        colors={isDarkMode 
          ? [colors.forest, colors.parchment] 
          : [colors.forest, '#4A8B5C', colors.parchment]
        }
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
      >
        <View style={styles.headerContent}>
          <Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {getGreeting()}
          </Text>
          <H1 style={{ color: '#FFFFFF' }}>
            {mover?.display_name || 'Mover'}
          </H1>
          
          {/* Quick Stats */}
          {mover?.current_weight && (
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Ionicons name="scale-outline" size={16} color="rgba(255,255,255,0.7)" />
                <Text variant="bodySmall" style={{ color: '#FFFFFF', marginLeft: 4 }}>
                  {mover.current_weight} {mover.weight_unit}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar-outline" size={16} color="rgba(255,255,255,0.7)" />
                <Text variant="bodySmall" style={{ color: '#FFFFFF', marginLeft: 4 }}>
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={[styles.content, { marginTop: -spacing.xl }]}>
        
        {/* Create Event CTA */}
        <Card variant="elevated" style={styles.ctaCard}>
          <CardContent>
            <H3>Ready for your next adventure?</H3>
            <Body color="secondary" style={{ marginTop: spacing.xs, marginBottom: spacing.md }}>
              Plan your event with checkpoints, crew, gear, and nutrition all in one place.
            </Body>
            <Button 
              onPress={() => navigation.navigate('CreateEvent')}
              fullWidth
            >
              Create New Event
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <H2>Upcoming Events</H2>
            {events.length > 0 && (
              <Button 
                variant="tertiary" 
                size="sm"
                onPress={() => navigation.navigate('Events')}
              >
                View All
              </Button>
            )}
          </View>

          {events.length === 0 ? (
            <Card style={styles.emptyCard}>
              <CardContent>
                <View style={styles.emptyContent}>
                  <Ionicons name="trail-sign-outline" size={48} color={colors.mist} />
                  <Body color="secondary" align="center" style={{ marginTop: spacing.sm }}>
                    No events planned yet.{'\n'}Create your first one above!
                  </Body>
                </View>
              </CardContent>
            </Card>
          ) : (
            events.slice(0, 3).map((event) => {
              const daysUntil = getDaysUntil(event.event_date);
              
              return (
                <Card 
                  key={event.id}
                  variant="standard"
                  onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  style={styles.eventCard}
                >
                  <CardContent>
                    <View style={styles.eventHeader}>
                      <View style={{ flex: 1 }}>
                        <H3>{event.name}</H3>
                        <BodySmall color="secondary">
                          {formatEventDate(event.event_date)}
                          {event.location && ` • ${event.location}`}
                        </BodySmall>
                      </View>
                      {daysUntil !== null && daysUntil > 0 && (
                        <View style={[styles.countdown, { backgroundColor: colors.forest + '15' }]}>
                          <Text variant="h3" style={{ color: colors.forest }}>
                            {daysUntil}
                          </Text>
                          <Text variant="caption" style={{ color: colors.forest }}>
                            days
                          </Text>
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
                            {event.total_elevation_gain} {event.elevation_unit}
                          </BodySmall>
                        </View>
                      )}
                      {event.total_gear_weight && (
                        <WeightBadge 
                          weight={event.total_gear_weight} 
                          unit={mover?.weight_unit as any || 'lbs'}
                          size="sm"
                        />
                      )}
                    </View>
                  </CardContent>
                </Card>
              );
            })
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <H2 style={{ marginBottom: spacing.md }}>Quick Actions</H2>
          <View style={styles.quickActions}>
            <Card 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Gear')}
            >
              <CardContent>
                <View style={[styles.actionIcon, { backgroundColor: colors.trail + '20' }]}>
                  <Ionicons name="bag-handle-outline" size={24} color={colors.trail} />
                </View>
                <BodySmall color="secondary" align="center">Gear</BodySmall>
              </CardContent>
            </Card>
            
            <Card 
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <CardContent>
                <View style={[styles.actionIcon, { backgroundColor: colors.forest + '20' }]}>
                  <Ionicons name="scale" size={24} color={colors.forest} />
                </View>
                <BodySmall color="secondary" align="center">Weight</BodySmall>
              </CardContent>
            </Card>
            
            <Card 
              style={styles.actionCard}
              onPress={() => navigation.navigate('DropBags', {})}
            >
              <CardContent>
                <View style={[styles.actionIcon, { backgroundColor: colors.sunrise + '20' }]}>
                  <Ionicons name="cube-outline" size={24} color={colors.sunrise} />
                </View>
                <BodySmall color="secondary" align="center">Drop Bags</BodySmall>
              </CardContent>
            </Card>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    marginTop: 8,
  },
  quickStats: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  ctaCard: {
    marginBottom: 24,
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
  emptyCard: {
    alignItems: 'center',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  eventCard: {
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    alignItems: 'center',
  },
  eventStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});
