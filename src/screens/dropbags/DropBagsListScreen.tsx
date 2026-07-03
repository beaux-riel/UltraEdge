/**
 * UltraEdge Drop Bags List Screen
 * List all drop bags with optional event filter
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '../../theme';
import { Text, H1, H2, Body, BodySmall, Button, Card, CardContent } from '../../components/ui';
import { useDropBags, DropBag } from '../../context/DropBagContext';
import { useEvents } from '../../context/EventContext';
import { useCheckpoints } from '../../context/CheckpointContext';

type Props = NativeStackScreenProps<any, 'DropBags'>;

export default function DropBagsListScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  // Optional event filter from route params
  const eventIdFilter = route.params?.eventId;

  const { dropBags, loading, refreshDropBags } = useDropBags();
  const { getEvent, events } = useEvents();
  const { getCheckpointById } = useCheckpoints();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | 'all'>(eventIdFilter || 'all');

  // Refresh when coming back to this screen
  useFocusEffect(
    useCallback(() => {
      refreshDropBags();
    }, [])
  );

  // Filter drop bags
  const filteredBags = useMemo(() => {
    let filtered = [...dropBags];

    // Apply event filter
    if (selectedEventId !== 'all') {
      filtered = filtered.filter(bag => bag.eventId === selectedEventId);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bag =>
        bag.name.toLowerCase().includes(query) ||
        bag.notes?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [dropBags, searchQuery, selectedEventId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshDropBags();
    setRefreshing(false);
  }, [refreshDropBags]);

  const renderDropBag = ({ item }: { item: DropBag }) => {
    const event = getEvent(item.eventId);
    const checkpoint = item.checkpointId 
      ? getCheckpointById(item.eventId, item.checkpointId) 
      : null;

    return (
      <Card
        variant="standard"
        style={styles.bagCard}
        onPress={() => navigation.navigate('DropBagDetail', { dropBagId: item.id })}
      >
        <CardContent>
          <View style={styles.bagRow}>
            {/* Icon */}
            <View style={[styles.bagIcon, { backgroundColor: colors.sunrise + '20' }]}>
              <Ionicons name="bag-handle" size={24} color={colors.sunrise} />
            </View>

            {/* Info */}
            <View style={styles.bagInfo}>
              <Text variant="h3">{item.name}</Text>
              
              {event && (
                <BodySmall color="secondary" style={{ marginTop: 2 }}>
                  {event.name}
                </BodySmall>
              )}
              
              <View style={styles.detailsRow}>
                {checkpoint ? (
                  <View style={[styles.badge, { backgroundColor: colors.meadow + '20' }]}>
                    <Ionicons name="flag" size={12} color={colors.meadow} />
                    <Text variant="bodySmall" style={{ color: colors.meadow, marginLeft: 4 }}>
                      {checkpoint.name}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.badge, { backgroundColor: colors.mist + '20' }]}>
                    <Ionicons name="help-circle" size={12} color={colors.mist} />
                    <Text variant="bodySmall" style={{ color: colors.mist, marginLeft: 4 }}>
                      No checkpoint
                    </Text>
                  </View>
                )}
                
                <View style={[styles.badge, { backgroundColor: colors.trail + '20', marginLeft: 8 }]}>
                  <Ionicons name="cube" size={12} color={colors.trail} />
                  <Text variant="bodySmall" style={{ color: colors.trail, marginLeft: 4 }}>
                    {item.items.length} {item.items.length === 1 ? 'item' : 'items'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Chevron */}
            <Ionicons name="chevron-forward" size={20} color={colors.mist} />
          </View>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.sunrise + '20' }]}>
        <Ionicons name="bag-handle-outline" size={48} color={colors.sunrise} />
      </View>
      <H2 style={{ marginTop: spacing.md }}>No Drop Bags Yet</H2>
      <Body color="secondary" align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
        Create drop bags to plan what gear and supplies you'll have at each checkpoint.
      </Body>
      <Button
        style={{ marginTop: spacing.lg }}
        onPress={() => navigation.navigate('CreateDropBag', { eventId: eventIdFilter })}
      >
        Create Your First Drop Bag
      </Button>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Navigation Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top + spacing.xs }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.bark + '20' }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color={colors.cream} />
          <Text variant="body" style={{ color: colors.cream, marginLeft: 4 }}>Main</Text>
        </TouchableOpacity>
        <Text variant="body" style={{ color: colors.cream }}>Drop Bags</Text>
        <View style={{ width: 80 }} />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: spacing.sm }]}>
        <View style={styles.headerTop}>
          <H1>Drop Bags</H1>
          <Button
            size="sm"
            onPress={() => navigation.navigate('CreateDropBag', { eventId: eventIdFilter })}
            icon={<Ionicons name="add" size={18} color={colors.snow} />}
          >
            Add
          </Button>
        </View>

        {/* Stats Summary */}
        {dropBags.length > 0 && (
          <Card variant="elevated" style={styles.statsSummary}>
            <CardContent>
              <View style={styles.statsRow}>
                <View>
                  <BodySmall color="secondary">Total Bags</BodySmall>
                  <View style={styles.statsNumber}>
                    <Text variant="display" style={{ color: colors.sunrise }}>
                      {selectedEventId === 'all' ? dropBags.length : filteredBags.length}
                    </Text>
                    <Text variant="h2" color="secondary" style={{ marginLeft: spacing.xs }}>
                      {(selectedEventId === 'all' ? dropBags.length : filteredBags.length) === 1 ? 'bag' : 'bags'}
                    </Text>
                  </View>
                </View>
                <View style={styles.itemsCount}>
                  <BodySmall color="secondary">Total Items</BodySmall>
                  <Text variant="h2" style={{ color: colors.trail }}>
                    {(selectedEventId === 'all' ? dropBags : filteredBags)
                      .reduce((sum, bag) => sum + bag.items.length, 0)}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.cream, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.mist} />
          <TextInput
            style={[styles.searchInput, { color: colors.bark }]}
            placeholder="Search drop bags..."
            placeholderTextColor={colors.mist}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.mist} />
            </TouchableOpacity>
          )}
        </View>

        {/* Event Filter Pills */}
        {!eventIdFilter && events.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterPill,
                {
                  backgroundColor: selectedEventId === 'all' ? colors.forest : colors.cream,
                  borderColor: selectedEventId === 'all' ? colors.forest : colors.border,
                },
              ]}
              onPress={() => setSelectedEventId('all')}
            >
              <Text
                variant="bodySmall"
                style={{ color: selectedEventId === 'all' ? colors.snow : colors.stone }}
              >
                All Events
              </Text>
            </TouchableOpacity>

            {events.map((event) => {
              const isSelected = selectedEventId === event.id;
              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: isSelected ? colors.forest : colors.cream,
                      borderColor: isSelected ? colors.forest : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedEventId(event.id)}
                >
                  <Ionicons
                    name="calendar"
                    size={14}
                    color={isSelected ? colors.snow : colors.mist}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    variant="bodySmall"
                    style={{ color: isSelected ? colors.snow : colors.stone }}
                    numberOfLines={1}
                  >
                    {event.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Drop Bags List */}
      {dropBags.length === 0 && !searchQuery && selectedEventId === 'all' ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredBags}
          keyExtractor={(item) => item.id}
          renderItem={renderDropBag}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.forest}
            />
          }
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Ionicons name="search" size={40} color={colors.mist} />
              <Body color="secondary" style={{ marginTop: spacing.sm }}>
                No drop bags found matching your search.
              </Body>
            </View>
          }
        />
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
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsSummary: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsNumber: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  itemsCount: {
    alignItems: 'flex-end',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterContainer: {
    paddingRight: 20,
    gap: 8,
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 150,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  bagCard: {
    marginBottom: 10,
  },
  bagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bagIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bagInfo: {
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 48,
  },
});
