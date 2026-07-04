/**
 * UltraEdge Select Crew Screen
 * Select existing crew members to assign to an event, with per-event roles.
 * A member can hold multiple roles for one event.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme';
import {
  Text,
  H1,
  H3,
  Body,
  BodySmall,
  Button,
} from '../../components/ui';
import { useCrewMembers, CrewMember, CrewRole, ROLES, ROLE_CONFIG } from '../../context/CrewContext';
import {
  EventCrewAssignment,
  loadEventCrewAssignments,
  saveEventCrewAssignments,
} from '../../lib/eventCrew';

type Props = NativeStackScreenProps<any, 'SelectCrew'>;

export default function SelectCrewScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const { crewMembers } = useCrewMembers();

  const eventId = route.params?.eventId;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rolesById, setRolesById] = useState<Record<string, CrewRole[]>>({});
  const [customRoleById, setCustomRoleById] = useState<Record<string, string>>({});
  const [alreadyAddedIds, setAlreadyAddedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Load already assigned crew
  useEffect(() => {
    const loadExisting = async () => {
      const allCrew = await loadEventCrewAssignments();
      const eventCrewIds = new Set(
        allCrew.filter(c => c.eventId === eventId).map(c => c.crewMemberId)
      );
      setAlreadyAddedIds(eventCrewIds);
    };
    loadExisting();
  }, [eventId]);

  // Filter out already-assigned crew
  const availableCrew = crewMembers.filter(c => !alreadyAddedIds.has(c.id));

  // Toggle member selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle a role on a selected member
  const toggleRole = (memberId: string, role: CrewRole) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRolesById(prev => {
      const current = prev[memberId] ?? [];
      const next = current.includes(role)
        ? current.filter(r => r !== role)
        : [...current, role];
      return { ...prev, [memberId]: next };
    });
  };

  // Save selections
  const handleSave = async () => {
    if (selectedIds.size === 0) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      const allCrew = await loadEventCrewAssignments();

      // Add new assignments with their per-event roles
      const newAssignments: EventCrewAssignment[] = Array.from(selectedIds).map(
        crewMemberId => {
          const roles = rolesById[crewMemberId] ?? [];
          return {
            eventId,
            crewMemberId,
            roles,
            customRole: roles.includes('other')
              ? customRoleById[crewMemberId]?.trim() || null
              : null,
          };
        }
      );

      await saveEventCrewAssignments([...allCrew, ...newAssignments]);

      navigation.goBack();
    } catch (error) {
      console.error('Failed to save crew:', error);
      Alert.alert('Error', 'Failed to assign crew to event');
    } finally {
      setSaving(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Render crew item
  const renderCrewItem = ({ item }: { item: CrewMember }) => {
    const isSelected = selectedIds.has(item.id);
    const memberRoles = rolesById[item.id] ?? [];

    return (
      <View
        style={[
          styles.listItem,
          {
            backgroundColor: isSelected ? colors.forest + '10' : colors.surface,
            borderColor: isSelected ? colors.forest : colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => toggleSelection(item.id)} style={styles.memberRow}>
          <View style={[styles.listItemIcon, { backgroundColor: colors.trail + '20' }]}>
            <Text variant="h3" style={{ color: colors.trail }}>
              {getInitials(item.name)}
            </Text>
          </View>
          <View style={styles.listItemContent}>
            <Body numberOfLines={1}>{item.name}</Body>
            {(item.phone || item.email) && (
              <BodySmall color="tertiary" numberOfLines={1}>
                {item.phone || item.email}
              </BodySmall>
            )}
          </View>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={24}
            color={isSelected ? colors.forest : colors.stone}
          />
        </TouchableOpacity>

        {/* Per-event role chips (multi-select) */}
        {isSelected && (
          <View style={styles.rolesSection}>
            <BodySmall color="secondary" style={{ marginBottom: 6 }}>
              Roles for this event
            </BodySmall>
            <View style={styles.roleChips}>
              {ROLES.map(role => {
                const config = ROLE_CONFIG[role];
                const isActive = memberRoles.includes(role);

                return (
                  <TouchableOpacity
                    key={role}
                    onPress={() => toggleRole(item.id, role)}
                    style={[
                      styles.roleChip,
                      {
                        backgroundColor: isActive ? config.color : colors.cream,
                        borderColor: isActive ? config.color : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={14}
                      color={isActive ? colors.snow : config.color}
                    />
                    <Text
                      variant="bodySmall"
                      style={{
                        color: isActive ? colors.snow : colors.stone,
                        marginLeft: 4,
                      }}
                    >
                      {config.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Custom label when "Other" is included */}
            {memberRoles.includes('other') && (
              <TextInput
                style={[
                  styles.customRoleInput,
                  {
                    backgroundColor: colors.cream,
                    borderColor: colors.border,
                    color: colors.bark,
                  },
                ]}
                placeholder="Custom role, e.g. Support Runner"
                placeholderTextColor={colors.mist}
                value={customRoleById[item.id] ?? ''}
                onChangeText={text =>
                  setCustomRoleById(prev => ({ ...prev, [item.id]: text }))
                }
                autoCapitalize="words"
              />
            )}
          </View>
        )}
      </View>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.mist} />
      <H3 color="secondary" style={{ marginTop: spacing.md }}>
        No Crew Available
      </H3>
      <Body color="tertiary" align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
        {alreadyAddedIds.size > 0
          ? 'All your crew members are already assigned to this event.'
          : 'Create some crew members first, then come back to assign them.'}
      </Body>
      <Button
        variant="secondary"
        onPress={() => navigation.navigate('CreateCrew', { eventId })}
        style={{ marginTop: spacing.lg }}
      >
        Create New Crew
      </Button>
    </View>
  );

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.stone} />
        </TouchableOpacity>
        <H1 style={{ flex: 1, textAlign: 'center' }}>Select Crew</H1>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.saveButton}
          disabled={saving}
        >
          <Body style={{ color: colors.forest, fontWeight: '600' }}>
            {saving ? 'Saving...' : `Add (${selectedIds.size})`}
          </Body>
        </TouchableOpacity>
      </View>

      {/* Crew List */}
      <FlatList
        data={availableCrew}
        renderItem={renderCrewItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          availableCrew.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  saveButton: {
    width: 80,
    height: 44,
    alignItems: 'flex-end',
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
  listItem: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
    marginRight: 12,
  },
  rolesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  roleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  customRoleInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});
