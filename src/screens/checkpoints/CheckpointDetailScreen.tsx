/**
 * UltraEdge Checkpoint Detail Screen
 * View full details of a single checkpoint/aid station
 */

import React, { useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { Text, H1, H2, H3, Body, BodySmall, Caption, Label, Button, Card, CardContent, CardFooter } from '../../components/ui';
import { useCheckpoints, CHECKPOINT_TYPE_INFO } from '../../context/CheckpointContext';
import { Checkpoint, CheckpointType } from '../../lib/database.types';

type RootStackParamList = {
  CheckpointDetail: { eventId: string; checkpointId: string };
  EditCheckpoint: { eventId: string; checkpointId: string };
  CheckpointsList: { eventId: string };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckpointDetail'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'CheckpointDetail'>;

interface DetailRowProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string | null | undefined;
  valueColor?: string;
}

function DetailRow({ icon, iconColor, label, value, valueColor }: DetailRowProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  
  if (!value) return null;
  
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.detailContent}>
        <Caption>{label}</Caption>
        <Body style={valueColor ? { color: valueColor } : undefined}>{value}</Body>
      </View>
    </View>
  );
}

interface FeatureBadgeProps {
  icon: string;
  label: string;
  color: string;
  enabled: boolean;
}

function FeatureBadge({ icon, label, color, enabled }: FeatureBadgeProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  
  return (
    <View 
      style={[
        styles.featureBadge, 
        { 
          backgroundColor: enabled ? color + '15' : colors.birch,
          opacity: enabled ? 1 : 0.5,
        }
      ]}
    >
      <Ionicons 
        name={(enabled ? icon : 'close-circle') as any} 
        size={20} 
        color={enabled ? color : colors.mist} 
      />
      <BodySmall 
        style={{ 
          marginLeft: 8, 
          color: enabled ? color : colors.mist,
        }}
      >
        {label}
      </BodySmall>
    </View>
  );
}

export default function CheckpointDetailScreen() {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  
  const { eventId, checkpointId } = route.params;
  const { getCheckpointById, deleteCheckpoint, duplicateCheckpoint } = useCheckpoints();
  
  const checkpoint = useMemo(() => 
    getCheckpointById(eventId, checkpointId),
    [getCheckpointById, eventId, checkpointId]
  );
  
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
  
  const typeInfo = CHECKPOINT_TYPE_INFO[checkpoint.checkpoint_type];
  
  const handleEdit = useCallback(() => {
    navigation.navigate('EditCheckpoint', { eventId, checkpointId });
  }, [navigation, eventId, checkpointId]);
  
  const handleDuplicate = useCallback(() => {
    Alert.alert(
      'Duplicate Checkpoint',
      `Create a copy of "${checkpoint.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => {
            duplicateCheckpoint(eventId, checkpointId);
            navigation.goBack();
          },
        },
      ]
    );
  }, [checkpoint.name, eventId, checkpointId, duplicateCheckpoint, navigation]);
  
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Checkpoint',
      `Are you sure you want to delete "${checkpoint.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteCheckpoint(eventId, checkpointId);
            navigation.goBack();
          },
        },
      ]
    );
  }, [checkpoint.name, eventId, checkpointId, deleteCheckpoint, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Card 
          variant="elevated" 
          style={[styles.headerCard, { backgroundColor: typeInfo.color }]}
        >
          <CardContent>
            <View style={styles.headerRow}>
              <View style={styles.headerIcon}>
                <Ionicons name={typeInfo.icon as any} size={32} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  {typeInfo.label}
                </Text>
                <H1 style={{ color: '#FFFFFF', marginTop: 2 }}>{checkpoint.name}</H1>
              </View>
            </View>
            
            {/* Distance & Elevation */}
            <View style={styles.headerStats}>
              {checkpoint.distance_from_start !== null && (
                <View style={styles.headerStat}>
                  <Text variant="display" style={{ color: '#FFFFFF' }}>
                    {checkpoint.distance_from_start.toFixed(1)}
                  </Text>
                  <Caption style={{ color: 'rgba(255,255,255,0.8)' }}>miles</Caption>
                </View>
              )}
              {checkpoint.elevation !== null && (
                <View style={styles.headerStat}>
                  <Text variant="display" style={{ color: '#FFFFFF' }}>
                    {checkpoint.elevation.toLocaleString()}
                  </Text>
                  <Caption style={{ color: 'rgba(255,255,255,0.8)' }}>ft elevation</Caption>
                </View>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Cutoff Time Alert */}
        {checkpoint.cutoff_time && (
          <Card 
            variant="standard" 
            style={[styles.cutoffCard, { borderColor: colors.sunrise, borderWidth: 1.5 }]}
          >
            <CardContent>
              <View style={styles.cutoffRow}>
                <View style={[styles.cutoffIcon, { backgroundColor: colors.sunrise + '20' }]}>
                  <Ionicons name="timer" size={24} color={colors.sunrise} />
                </View>
                <View style={{ flex: 1 }}>
                  <Label style={{ color: colors.sunrise }}>CUTOFF TIME</Label>
                  <H2 style={{ color: colors.sunrise }}>{checkpoint.cutoff_time}</H2>
                  <Caption>You must leave by this time</Caption>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <View style={styles.section}>
          <Label style={{ marginBottom: spacing.md }}>CHECKPOINT FEATURES</Label>
          <View style={styles.featuresGrid}>
            <FeatureBadge
              icon="people"
              label="Crew Access"
              color={colors.trail}
              enabled={checkpoint.has_crew_access}
            />
            <FeatureBadge
              icon="bag-handle"
              label="Drop Bag"
              color={colors.sunrise}
              enabled={checkpoint.has_drop_bag}
            />
            <FeatureBadge
              icon="walk"
              label="Pacer Pickup"
              color={colors.forest}
              enabled={checkpoint.has_pacer_pickup}
            />
            <FeatureBadge
              icon="exit"
              label="Pacer Dropoff"
              color={colors.sky}
              enabled={checkpoint.has_pacer_dropoff}
            />
          </View>
        </View>

        {/* Aid Station Supplies */}
        {checkpoint.aid_supplies && checkpoint.aid_supplies.length > 0 && (
          <View style={styles.section}>
            <Label style={{ marginBottom: spacing.md }}>AID STATION SUPPLIES</Label>
            <Card variant="standard">
              <CardContent>
                <View style={styles.suppliesGrid}>
                  {checkpoint.aid_supplies.map((supply, index) => (
                    <View 
                      key={index} 
                      style={[styles.supplyChip, { backgroundColor: colors.meadow + '15' }]}
                    >
                      <Ionicons 
                        name="checkmark-circle" 
                        size={16} 
                        color={colors.meadow} 
                      />
                      <BodySmall style={{ marginLeft: 6, color: colors.meadow }}>
                        {supply}
                      </BodySmall>
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Location Details */}
        {checkpoint.location_description && (
          <View style={styles.section}>
            <Label style={{ marginBottom: spacing.md }}>LOCATION</Label>
            <Card variant="standard">
              <CardContent>
                <DetailRow
                  icon="location"
                  iconColor={colors.forest}
                  label="Description"
                  value={checkpoint.location_description}
                />
                {(checkpoint.latitude && checkpoint.longitude) && (
                  <DetailRow
                    icon="navigate"
                    iconColor={colors.sky}
                    label="Coordinates"
                    value={`${checkpoint.latitude.toFixed(6)}, ${checkpoint.longitude.toFixed(6)}`}
                  />
                )}
              </CardContent>
            </Card>
          </View>
        )}

        {/* Estimated Times */}
        {(checkpoint.estimated_arrival || checkpoint.estimated_duration) && (
          <View style={styles.section}>
            <Label style={{ marginBottom: spacing.md }}>TIME ESTIMATES</Label>
            <Card variant="standard">
              <CardContent>
                <DetailRow
                  icon="time"
                  iconColor={colors.forest}
                  label="Estimated Arrival"
                  value={checkpoint.estimated_arrival}
                />
                <DetailRow
                  icon="hourglass"
                  iconColor={colors.trail}
                  label="Time at Checkpoint"
                  value={checkpoint.estimated_duration}
                />
              </CardContent>
            </Card>
          </View>
        )}

        {/* Notes */}
        {checkpoint.notes && (
          <View style={styles.section}>
            <Label style={{ marginBottom: spacing.md }}>NOTES</Label>
            <Card variant="standard">
              <CardContent>
                <Body>{checkpoint.notes}</Body>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <View style={styles.actionsRow}>
            <Button
              variant="secondary"
              onPress={handleDuplicate}
              icon={<Ionicons name="copy-outline" size={18} color={colors.trail} />}
              style={{ flex: 1 }}
            >
              Duplicate
            </Button>
            <View style={{ width: spacing.md }} />
            <Button
              variant="danger"
              onPress={handleDelete}
              icon={<Ionicons name="trash-outline" size={18} color="#FFFFFF" />}
              style={{ flex: 1 }}
            >
              Delete
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* Edit FAB */}
      <View style={[styles.fabContainer, { bottom: insets.bottom + 24 }]}>
        <Button
          onPress={handleEdit}
          icon={<Ionicons name="pencil" size={18} color="#FFFFFF" />}
        >
          Edit Checkpoint
        </Button>
      </View>
    </View>
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
  headerCard: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerStats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 32,
  },
  headerStat: {
    alignItems: 'flex-start',
  },
  cutoffCard: {
    marginBottom: 24,
  },
  cutoffRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cutoffIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  section: {
    marginBottom: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    width: '48%',
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
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
  },
  fabContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
});
