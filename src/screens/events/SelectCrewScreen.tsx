/**
 * UltraEdge Select Crew Screen
 * Select existing crew members to assign to an event
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../theme';
import { 
  H1, 
  H3, 
  Body, 
  BodySmall, 
  Button, 
} from '../../components/ui';
import { useCrewMembers, CrewMember, ROLE_CONFIG } from '../../context/CrewContext';

type Props = NativeStackScreenProps<any, 'SelectCrew'>;

const EVENT_CREW_KEY = '@ultraedge/event-crew';

interface EventCrewAssignment {
  eventId: string;
  crewMemberId: string;
  notes?: string;
}

export default function SelectCrewScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const { crewMembers } = useCrewMembers();
  
  const eventId = route.params?.eventId;
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alreadyAddedIds, setAlreadyAddedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Load already assigned crew
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const stored = await AsyncStorage.getItem(EVENT_CREW_KEY);
        if (stored) {
          const allCrew: EventCrewAssignment[] = JSON.parse(stored);
          const eventCrewIds = new Set(
            allCrew.filter(c => c.eventId === eventId).map(c => c.crewMemberId)
          );
          setAlreadyAddedIds(eventCrewIds);
        }
      } catch (error) {
        console.error('Failed to load existing crew:', error);
      }
    };
    loadExisting();
  }, [eventId]);

  // Filter out already-assigned crew
  const availableCrew = crewMembers.filter(c => !alreadyAddedIds.has(c.id));

  // Toggle selection
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

  // Save selections
  const handleSave = async () => {
    if (selectedIds.size === 0) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      const stored = await AsyncStorage.getItem(EVENT_CREW_KEY);
      const allCrew: EventCrewAssignment[] = stored ? JSON.parse(stored) : [];
      
      // Add new assignments
      const newAssignments: EventCrewAssignment[] = Array.from(selectedIds).map(crewMemberId => ({
        eventId,
        crewMemberId,
      }));
      
      const updated = [...allCrew, ...newAssignments];
      await AsyncStorage.setItem(EVENT_CREW_KEY, JSON.stringify(updated));
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save crew:', error);
      Alert.alert('Error', 'Failed to assign crew to event');
    } finally {
      setSaving(false);
    }
  };

  // Render crew item
  const renderCrewItem = ({ item }: { item: CrewMember }) => {
    const isSelected = selectedIds.has(item.id);
    const roleInfo = ROLE_CONFIG[item.role];
    
    return (
      <TouchableOpacity
        onPress={() => toggleSelection(item.id)}
        style={[
          styles.listItem,
          { 
            backgroundColor: isSelected ? colors.forest + '10' : colors.surface,
            borderColor: isSelected ? colors.forest : colors.border,
          }
        ]}
      >
        <View style={[styles.listItemIcon, { backgroundColor: roleInfo.color + '20' }]}>
          <Ionicons name={roleInfo.icon as any} size={20} color={roleInfo.color} />
        </View>
        <View style={styles.listItemContent}>
          <Body numberOfLines={1}>{item.name}</Body>
          <BodySmall color="tertiary">
            {item.customRole || roleInfo.label}
            {item.phone ? ` • ${item.phone}` : ''}
          </BodySmall>
        </View>
        <Ionicons 
          name={isSelected ? 'checkbox' : 'square-outline'} 
          size={24} 
          color={isSelected ? colors.forest : colors.stone} 
        />
      </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
});
