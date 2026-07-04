/**
 * UltraEdge Crew List Screen
 * List all crew members with avatar, name, and role
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../theme';
import { Text, H1, H2, H3, Body, BodySmall, Button, Card, CardContent } from '../../components/ui';
import { useCrewMembers } from '../../context/CrewContext';

export default function CrewListScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  const { crewMembers, loading, refreshCrewMembers } = useCrewMembers();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Data is already loaded via context
    }, [])
  );

  // Filter crew members
  const filteredMembers = useMemo(() => {
    let filtered = [...crewMembers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((member) =>
        member.name.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.phone?.includes(query)
      );
    }

    return filtered;
  }, [crewMembers, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshCrewMembers();
    setRefreshing(false);
  }, [refreshCrewMembers]);

  // Get initials for avatar
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const renderCrewMember = ({ item }: { item: typeof crewMembers[0] }) => {
    return (
      <Card
        variant="standard"
        style={styles.memberCard}
        onPress={() => navigation.navigate('CrewDetail', { crewId: item.id })}
      >
        <CardContent>
          <View style={styles.memberRow}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: colors.trail + '20' }]}>
              {item.avatar_url ? (
                <Ionicons name="person" size={24} color={colors.trail} />
              ) : (
                <Text variant="h3" style={{ color: colors.trail }}>
                  {getInitials(item.name)}
                </Text>
              )}
            </View>

            {/* Info */}
            <View style={styles.memberInfo}>
              <Text variant="h3">{item.name}</Text>
              {(item.phone || item.email) && (
                <BodySmall color="tertiary" style={{ marginTop: 2 }} numberOfLines={1}>
                  {item.phone || item.email}
                </BodySmall>
              )}
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
      <View style={[styles.emptyIcon, { backgroundColor: colors.trail + '20' }]}>
        <Ionicons name="people-outline" size={48} color={colors.trail} />
      </View>
      <H2 style={{ marginTop: spacing.md }}>No Crew Yet</H2>
      <Body color="secondary" align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
        Build your support team! Add pacers, crew chiefs, drivers, and anyone helping you on race day.
      </Body>
      <Button
        style={{ marginTop: spacing.lg }}
        onPress={() => navigation.navigate('CreateCrew')}
      >
        Add Your First Crew Member
      </Button>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerTop}>
          <H1>Crew</H1>
          <Button
            size="sm"
            onPress={() => navigation.navigate('CreateCrew')}
            icon={<Ionicons name="add" size={18} color={colors.snow} />}
          >
            Add
          </Button>
        </View>

        {/* Stats Summary */}
        {crewMembers.length > 0 && (
          <Card variant="elevated" style={styles.statsSummary}>
            <CardContent>
              <View style={styles.statsRow}>
                <View>
                  <BodySmall color="secondary">Total Crew</BodySmall>
                  <View style={styles.statsNumber}>
                    <Text variant="display" style={{ color: colors.forest }}>
                      {crewMembers.length}
                    </Text>
                    <Text variant="h2" color="secondary" style={{ marginLeft: spacing.xs }}>
                      {crewMembers.length === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
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
            placeholder="Search crew..."
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

      </View>

      {/* Crew List */}
      {crewMembers.length === 0 && !searchQuery ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredMembers}
          keyExtractor={(item) => item.id}
          renderItem={renderCrewMember}
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
                No crew members found matching your search.
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
  listContent: {
    paddingHorizontal: 20,
  },
  memberCard: {
    marginBottom: 10,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
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
