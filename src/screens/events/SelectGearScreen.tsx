/**
 * UltraEdge Select Gear Screen
 * Select existing gear items to add to an event
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
  Card, 
  CardContent 
} from '../../components/ui';
import { useGear, GearItem } from '../../context/GearContext';

type Props = NativeStackScreenProps<any, 'SelectGear'>;

const EVENT_GEAR_KEY = '@ultraedge/event-gear';

interface EventGearAllocation {
  eventId: string;
  gearItemId: string;
  isWorn: boolean;
  isCarried: boolean;
  quantity: number;
  notes?: string;
}

// Category icons
const CATEGORY_ICONS: Record<string, string> = {
  footwear: 'footsteps-outline',
  clothing: 'shirt-outline',
  pack: 'cube-outline',
  hydration: 'water-outline',
  lighting: 'flashlight-outline',
  navigation: 'compass-outline',
  safety: 'medkit-outline',
  poles: 'swap-vertical-outline',
  nutrition: 'nutrition-outline',
  other: 'ellipse-outline',
};

export default function SelectGearScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const { gearItems } = useGear();
  
  const eventId = route.params?.eventId;
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [alreadyAddedIds, setAlreadyAddedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Load already added gear
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const stored = await AsyncStorage.getItem(EVENT_GEAR_KEY);
        if (stored) {
          const allGear: EventGearAllocation[] = JSON.parse(stored);
          const eventGearIds = new Set(
            allGear.filter(g => g.eventId === eventId).map(g => g.gearItemId)
          );
          setAlreadyAddedIds(eventGearIds);
        }
      } catch (error) {
        console.error('Failed to load existing gear:', error);
      }
    };
    loadExisting();
  }, [eventId]);

  // Filter out retired and already-added gear
  const availableGear = gearItems.filter(
    g => !g.retired && g.isActive && !alreadyAddedIds.has(g.id)
  );

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
      const stored = await AsyncStorage.getItem(EVENT_GEAR_KEY);
      const allGear: EventGearAllocation[] = stored ? JSON.parse(stored) : [];
      
      // Add new allocations
      const newAllocations: EventGearAllocation[] = Array.from(selectedIds).map(gearItemId => ({
        eventId,
        gearItemId,
        isWorn: false,
        isCarried: true,
        quantity: 1,
      }));
      
      const updated = [...allGear, ...newAllocations];
      await AsyncStorage.setItem(EVENT_GEAR_KEY, JSON.stringify(updated));
      
      navigation.goBack();
    } catch (error) {
      console.error('Failed to save gear:', error);
      Alert.alert('Error', 'Failed to add gear to event');
    } finally {
      setSaving(false);
    }
  };

  // Render gear item
  const renderGearItem = ({ item }: { item: GearItem }) => {
    const isSelected = selectedIds.has(item.id);
    const iconName = CATEGORY_ICONS[item.category] || 'ellipse-outline';
    
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
        <View style={[styles.listItemIcon, { backgroundColor: colors.trail + '20' }]}>
          <Ionicons name={iconName as any} size={20} color={colors.trail} />
        </View>
        <View style={styles.listItemContent}>
          <Body numberOfLines={1}>{item.name}</Body>
          <BodySmall color="tertiary">
            {item.brand || item.category}
            {item.weight ? ` • ${item.weight} ${item.weightUnit}` : ''}
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
      <Ionicons name="cube-outline" size={64} color={colors.mist} />
      <H3 color="secondary" style={{ marginTop: spacing.md }}>
        No Gear Available
      </H3>
      <Body color="tertiary" align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
        {alreadyAddedIds.size > 0 
          ? 'All your gear is already added to this event.'
          : 'Create some gear items first, then come back to add them.'}
      </Body>
      <Button
        variant="secondary"
        onPress={() => navigation.navigate('CreateGear', { eventId })}
        style={{ marginTop: spacing.lg }}
      >
        Create New Gear
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
        <H1 style={{ flex: 1, textAlign: 'center' }}>Select Gear</H1>
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

      {/* Gear List */}
      <FlatList
        data={availableGear}
        renderItem={renderGearItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          availableGear.length === 0 && styles.emptyListContent,
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
