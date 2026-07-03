/**
 * UltraEdge Checkpoints List Screen
 * Displays all checkpoints for an event in a timeline-style list
 * Ordered by distance from start with cutoff times and key info
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { Text, H1, H2, H3, Body, BodySmall, Caption, Button, Card, CardContent } from '../../components/ui';
import { useCheckpoints, CHECKPOINT_TYPE_INFO } from '../../context/CheckpointContext';
import { Checkpoint, CheckpointType } from '../../lib/database.types';

type RootStackParamList = {
  CheckpointsList: { eventId: string; eventName?: string };
  CreateCheckpoint: { eventId: string };
  CheckpointDetail: { eventId: string; checkpointId: string };
  EditCheckpoint: { eventId: string; checkpointId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckpointsList'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'CheckpointsList'>;

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onPress: () => void;
  distanceUnit?: string;
}

function CheckpointCard({ 
  checkpoint, 
  index, 
  isFirst, 
  isLast, 
  onPress,
  distanceUnit = 'mi'
}: CheckpointCardProps) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  
  const typeInfo = CHECKPOINT_TYPE_INFO[checkpoint.checkpoint_type];
  
  // Format distance
  const formatDistance = (distance: number | null) => {
    if (distance === null || distance === undefined) return '--';
    return distance.toFixed(1);
  };
  
  // Format cutoff time
  const formatCutoff = (cutoff: string | null) => {
    if (!cutoff) return null;
    // Assuming cutoff is in HH:MM format or ISO string
    return cutoff;
  };
  
  // Determine if cutoff is approaching (warning state)
  const hasCutoffWarning = checkpoint.cutoff_time != null;

  return (
    <View style={styles.timelineItem}>
      {/* Timeline connector */}
      <View style={styles.timelineConnector}>
        {/* Line above */}
        {!isFirst && (
          <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
        )}
        
        {/* Dot */}
        <View 
          style={[
            styles.timelineDot,
            { 
              backgroundColor: typeInfo.color,
              borderColor: colors.surface,
            }
          ]}
        >
          <Ionicons 
            name={typeInfo.icon as any} 
            size={12} 
            color={colors.snow} 
          />
        </View>
        
        {/* Line below */}
        {!isLast && (
          <View style={[styles.timelineLineBottom, { backgroundColor: colors.border }]} />
        )}
      </View>
      
      {/* Card */}
      <Card 
        variant="standard" 
        style={styles.checkpointCard}
        onPress={onPress}
      >
        <CardContent>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
                <Text variant="caption" style={{ color: typeInfo.color }}>
                  {typeInfo.label}
                </Text>
              </View>
              <H3 style={{ marginTop: spacing.xs }}>{checkpoint.name}</H3>
            </View>
            
            {/* Distance */}
            <View style={styles.distanceContainer}>
              <Text variant="h2" style={{ color: colors.forest }}>
                {formatDistance(checkpoint.distance_from_start)}
              </Text>
              <Caption>{distanceUnit}</Caption>
            </View>
          </View>
          
          {/* Details row */}
          <View style={styles.detailsRow}>
            {/* Cutoff */}
            {checkpoint.cutoff_time && (
              <View style={styles.detailItem}>
                <Ionicons 
                  name="time-outline" 
                  size={14} 
                  color={colors.sunrise} 
                />
                <BodySmall style={{ color: colors.sunrise, marginLeft: 4 }}>
                  Cutoff: {formatCutoff(checkpoint.cutoff_time)}
                </BodySmall>
              </View>
            )}
            
            {/* Elevation */}
            {checkpoint.elevation && (
              <View style={styles.detailItem}>
                <Ionicons 
                  name="trending-up" 
                  size={14} 
                  color={colors.stone} 
                />
                <BodySmall color="secondary" style={{ marginLeft: 4 }}>
                  {checkpoint.elevation} ft
                </BodySmall>
              </View>
            )}
          </View>
          
          {/* Feature badges */}
          <View style={styles.badges}>
            {checkpoint.has_crew_access && (
              <View style={[styles.badge, { backgroundColor: colors.trail + '20' }]}>
                <Ionicons name="people" size={12} color={colors.trail} />
                <Caption style={{ color: colors.trail, marginLeft: 4 }}>Crew</Caption>
              </View>
            )}
            
            {checkpoint.has_drop_bag && (
              <View style={[styles.badge, { backgroundColor: colors.sunrise + '20' }]}>
                <Ionicons name="bag-handle" size={12} color={colors.sunrise} />
                <Caption style={{ color: colors.sunrise, marginLeft: 4 }}>Drop Bag</Caption>
              </View>
            )}
            
            {checkpoint.has_pacer_pickup && (
              <View style={[styles.badge, { backgroundColor: colors.forest + '20' }]}>
                <Ionicons name="walk" size={12} color={colors.forest} />
                <Caption style={{ color: colors.forest, marginLeft: 4 }}>Pacer</Caption>
              </View>
            )}
            
            {(checkpoint.aid_supplies?.length ?? 0) > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.meadow + '20' }]}>
                <Ionicons name="nutrition" size={12} color={colors.meadow} />
                <Caption style={{ color: colors.meadow, marginLeft: 4 }}>
                  {checkpoint.aid_supplies?.length} supplies
                </Caption>
              </View>
            )}
          </View>
        </CardContent>
      </Card>
    </View>
  );
}

export default function CheckpointsListScreen() {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  
  const { eventId, eventName = 'Event' } = route.params;
  const { getCheckpointsByEventId, loading, deleteCheckpoint } = useCheckpoints();
  
  const checkpoints = useMemo(() => 
    getCheckpointsByEventId(eventId),
    [getCheckpointsByEventId, eventId]
  );
  
  const [refreshing, setRefreshing] = React.useState(false);
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh - in real app, would sync with backend
    setTimeout(() => setRefreshing(false), 500);
  }, []);
  
  const handleCheckpointPress = useCallback((checkpointId: string) => {
    navigation.navigate('CheckpointDetail', { eventId, checkpointId });
  }, [navigation, eventId]);
  
  const handleCreateCheckpoint = useCallback(() => {
    navigation.navigate('CreateCheckpoint', { eventId });
  }, [navigation, eventId]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const crewPoints = checkpoints.filter(cp => cp.has_crew_access).length;
    const dropBagPoints = checkpoints.filter(cp => cp.has_drop_bag).length;
    const aidStations = checkpoints.filter(cp => cp.checkpoint_type === 'aid_station').length;
    return { crewPoints, dropBagPoints, aidStations, total: checkpoints.length };
  }, [checkpoints]);

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Navigation Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.bark} />
        </TouchableOpacity>
        <H2>Checkpoints</H2>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.forest}
          />
        }
      >
        {/* Header Stats */}
        <View style={[styles.header, { paddingTop: spacing.md, borderBottomColor: colors.borderLight }]}>
          <BodySmall color="secondary">{eventName}</BodySmall>
          
          {/* Quick stats */}
          {checkpoints.length > 0 && (
            <View style={[styles.statsRow, { marginTop: spacing.md }]}>
              <View style={[styles.statItem, { backgroundColor: colors.cream }]}>
                <Text variant="h3" style={{ color: colors.forest }}>{stats.total}</Text>
                <Caption>Total</Caption>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.cream }]}>
                <Text variant="h3" style={{ color: colors.sky }}>{stats.aidStations}</Text>
                <Caption>Aid</Caption>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.cream }]}>
                <Text variant="h3" style={{ color: colors.trail }}>{stats.crewPoints}</Text>
                <Caption>Crew</Caption>
              </View>
              <View style={[styles.statItem, { backgroundColor: colors.cream }]}>
                <Text variant="h3" style={{ color: colors.sunrise }}>{stats.dropBagPoints}</Text>
                <Caption>Drop Bags</Caption>
              </View>
            </View>
          )}
        </View>
        
        {/* Empty State */}
        {checkpoints.length === 0 && !loading && (
          <Card style={styles.emptyCard}>
            <CardContent>
              <View style={styles.emptyContent}>
                <Ionicons name="flag-outline" size={48} color={colors.mist} />
                <H3 style={{ marginTop: spacing.md, textAlign: 'center' }}>
                  No Checkpoints Yet
                </H3>
                <Body 
                  color="secondary" 
                  align="center" 
                  style={{ marginTop: spacing.xs, marginBottom: spacing.lg }}
                >
                  Add your first checkpoint to start{'\n'}planning your race course.
                </Body>
                <Button onPress={handleCreateCheckpoint}>
                  Add First Checkpoint
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
        
        {/* Timeline List */}
        {checkpoints.length > 0 && (
          <View style={styles.timeline}>
            {checkpoints.map((checkpoint, index) => (
              <CheckpointCard
                key={checkpoint.id}
                checkpoint={checkpoint}
                index={index}
                isFirst={index === 0}
                isLast={index === checkpoints.length - 1}
                onPress={() => handleCheckpointPress(checkpoint.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* FAB */}
      {checkpoints.length > 0 && (
        <View style={[styles.fabContainer, { bottom: insets.bottom + 24 }]}>
          <Button
            onPress={handleCreateCheckpoint}
            icon={<Ionicons name="add" size={20} color={colors.snow} />}
          >
            Add Checkpoint
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyCard: {
    marginTop: 24,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  timeline: {
    marginTop: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 140,
  },
  timelineConnector: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 20,
  },
  timelineLineBottom: {
    position: 'absolute',
    top: 40,
    bottom: 0,
    width: 2,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    borderWidth: 3,
  },
  checkpointCard: {
    flex: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  distanceContainer: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    left: 20,
    alignItems: 'center',
  },
});
