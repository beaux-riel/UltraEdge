/**
 * UltraEdge Drop Bag Detail Screen
 * View a single drop bag with contents and checkpoint info
 */

import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../theme';
import { Text, H1, H2, H3, Body, BodySmall, Caption, Button, Card, CardContent } from '../../components/ui';
import { useDropBags } from '../../context/DropBagContext';
import { useEvents } from '../../context/EventContext';
import { useCheckpoints, CHECKPOINT_TYPE_INFO } from '../../context/CheckpointContext';
import { useGear } from '../../context/GearContext';

type Props = NativeStackScreenProps<any, 'DropBagDetail'>;

export default function DropBagDetailScreen({ navigation, route }: Props) {
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  const dropBagId = route.params?.dropBagId;

  const { getDropBag, deleteDropBag, refreshDropBags } = useDropBags();
  const { getEvent } = useEvents();
  const { getCheckpointById } = useCheckpoints();
  const { getGearItem } = useGear();

  const dropBag = getDropBag(dropBagId);
  const event = dropBag ? getEvent(dropBag.eventId) : null;
  const checkpoint = dropBag?.checkpointId 
    ? getCheckpointById(dropBag.eventId, dropBag.checkpointId) 
    : null;

  const [refreshing, setRefreshing] = React.useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshDropBags();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDropBags();
    setRefreshing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Drop Bag',
      `Are you sure you want to delete "${dropBag?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDropBag(dropBagId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!dropBag) {
    return (
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <View style={[styles.centered, { paddingTop: insets.top + 100 }]}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.mist} />
          <Body color="secondary" style={{ marginTop: spacing.md }}>
            Drop bag not found
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

  const checkpointTypeInfo = checkpoint 
    ? CHECKPOINT_TYPE_INFO[checkpoint.checkpoint_type] 
    : null;

  return (
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
            ? [colors.sunrise, colors.parchment] 
            : [colors.sunrise, colors.sunriseSoft, colors.parchment]
          }
          style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
        >
          {/* Navigation */}
          <View style={styles.heroNav}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.navButton}
            >
              <Ionicons name="arrow-back" size={24} color={colors.snow} />
            </TouchableOpacity>
            <View style={styles.heroActions}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditDropBag', { dropBagId })}
                style={styles.navButton}
              >
                <Ionicons name="pencil" size={22} color={colors.snow} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.navButton}
              >
                <Ionicons name="trash-outline" size={22} color={colors.snow} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Drop Bag Info */}
          <View style={styles.heroContent}>
            <View style={[styles.iconBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="bag-handle" size={32} color={colors.snow} />
            </View>
            <H1 style={{ color: colors.snow, marginTop: spacing.sm }}>{dropBag.name}</H1>
            {event && (
              <BodySmall style={{ color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs }}>
                {event.name}
              </BodySmall>
            )}
          </View>

          {/* Items Count */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text variant="display" style={{ color: colors.snow }}>
                {dropBag.items.length}
              </Text>
              <BodySmall style={{ color: 'rgba(255,255,255,0.8)' }}>
                {dropBag.items.length === 1 ? 'item' : 'items'}
              </BodySmall>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={[styles.content, { marginTop: -spacing.xl }]}>
          {/* Checkpoint Info */}
          <Card variant="elevated" style={styles.section}>
            <CardContent>
              <View style={styles.sectionHeader}>
                <Ionicons name="flag" size={20} color={colors.meadow} />
                <H3 style={{ marginLeft: spacing.sm }}>Checkpoint Location</H3>
              </View>
              {checkpoint ? (
                <View style={styles.checkpointInfo}>
                  <View style={[styles.cpIcon, { backgroundColor: checkpointTypeInfo?.color + '20' }]}>
                    <Ionicons 
                      name={checkpointTypeInfo?.icon as any} 
                      size={24} 
                      color={checkpointTypeInfo?.color} 
                    />
                  </View>
                  <View style={styles.cpDetails}>
                    <Text variant="h3">{checkpoint.name}</Text>
                    <Caption color="tertiary">{checkpointTypeInfo?.label}</Caption>
                    {checkpoint.distance_from_start && (
                      <BodySmall color="secondary" style={{ marginTop: 4 }}>
                        Mile {checkpoint.distance_from_start}
                      </BodySmall>
                    )}
                    {checkpoint.cutoff_time && (
                      <View style={styles.cutoffBadge}>
                        <Ionicons name="time" size={12} color={colors.clay} />
                        <Caption style={{ color: colors.clay, marginLeft: 4 }}>
                          Cutoff: {checkpoint.cutoff_time}
                        </Caption>
                      </View>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.noCheckpoint}>
                  <Ionicons name="help-circle-outline" size={32} color={colors.mist} />
                  <BodySmall color="tertiary" style={{ marginTop: spacing.xs }}>
                    No checkpoint assigned
                  </BodySmall>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onPress={() => navigation.navigate('EditDropBag', { dropBagId })}
                    style={{ marginTop: spacing.sm }}
                  >
                    Assign Checkpoint
                  </Button>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Items List */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <H2>Contents</H2>
              <Button
                variant="tertiary"
                size="sm"
                onPress={() => navigation.navigate('EditDropBag', { dropBagId })}
              >
                Edit
              </Button>
            </View>

            {dropBag.items.length === 0 ? (
              <Card>
                <CardContent>
                  <View style={styles.emptyItems}>
                    <Ionicons name="cube-outline" size={40} color={colors.mist} />
                    <BodySmall color="tertiary" align="center" style={{ marginTop: spacing.sm }}>
                      No items in this drop bag.{'\n'}Add gear and supplies.
                    </BodySmall>
                  </View>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent>
                  {dropBag.items.map((item, index) => {
                    const gearDetails = getGearItem(item.refId);
                    return (
                      <View 
                        key={item.id} 
                        style={[
                          styles.itemRow,
                          index > 0 && { borderTopWidth: 1, borderTopColor: colors.borderLight },
                        ]}
                      >
                        <View style={[styles.itemIcon, { backgroundColor: colors.trail + '15' }]}>
                          <Ionicons name="cube" size={18} color={colors.trail} />
                        </View>
                        <View style={styles.itemInfo}>
                          <Text variant="body">{item.name}</Text>
                          {gearDetails?.brand && (
                            <Caption color="tertiary">{gearDetails.brand}</Caption>
                          )}
                          {item.notes && (
                            <BodySmall color="secondary" style={{ marginTop: 2 }}>
                              {item.notes}
                            </BodySmall>
                          )}
                        </View>
                        <View style={[styles.qtyBadge, { backgroundColor: colors.cream }]}>
                          <Text variant="mono" style={{ color: colors.stone }}>
                            ×{item.quantity}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </View>

          {/* Notes */}
          {dropBag.notes && (
            <Card style={styles.section}>
              <CardContent>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text" size={20} color={colors.stone} />
                  <H3 style={{ marginLeft: spacing.sm }}>Notes</H3>
                </View>
                <Body color="secondary">{dropBag.notes}</Body>
              </CardContent>
            </Card>
          )}

          {/* Meta Info */}
          <Card style={styles.section}>
            <CardContent>
              <View style={styles.metaRow}>
                <Caption color="tertiary">Created</Caption>
                <Caption color="secondary">
                  {new Date(dropBag.created_at).toLocaleDateString()}
                </Caption>
              </View>
              <View style={styles.metaRow}>
                <Caption color="tertiary">Updated</Caption>
                <Caption color="secondary">
                  {new Date(dropBag.updated_at).toLocaleDateString()}
                </Caption>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

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
    alignItems: 'center',
    marginTop: 16,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkpointInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cpDetails: {
    flex: 1,
  },
  cutoffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  noCheckpoint: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyItems: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  qtyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
});
