/**
 * UltraEdge Gear List Screen
 * Master gear inventory grouped by category
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  SectionList,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { useTheme } from '../../theme';
import { Text, H1, H2, H3, Body, BodySmall, Button, Card, CardContent, WeightBadge } from '../../components/ui';
import { useGear } from '../../context/GearContext';
import { colors as themeColors } from '../../theme/colors';
import type { GearCategory, WeightUnit } from '../../lib/database.types';

// Category labels and icons
const CATEGORY_CONFIG: Record<GearCategory | 'nutrition', { label: string; icon: string }> = {
  footwear: { label: 'Footwear', icon: 'footsteps' },
  clothing: { label: 'Clothing', icon: 'shirt' },
  pack: { label: 'Pack & Storage', icon: 'cube' },
  hydration: { label: 'Hydration', icon: 'water' },
  lighting: { label: 'Lighting', icon: 'flashlight' },
  navigation: { label: 'Navigation', icon: 'compass' },
  safety: { label: 'Safety', icon: 'medkit' },
  poles: { label: 'Poles', icon: 'git-branch' },
  nutrition: { label: 'Nutrition', icon: 'nutrition' },
  other: { label: 'Other', icon: 'ellipsis-horizontal' },
};

const CATEGORY_ORDER: (GearCategory | 'nutrition')[] = [
  'pack', 'footwear', 'clothing', 'hydration', 'lighting',
  'navigation', 'safety', 'poles', 'nutrition', 'other',
];

// Convert weight to grams for calculation
function toGrams(weight: number, unit: WeightUnit): number {
  switch (unit) {
    case 'g': return weight;
    case 'oz': return weight * 28.3495;
    case 'kg': return weight * 1000;
    case 'lbs': return weight * 453.592;
    default: return weight;
  }
}

// Format weight for display
function formatWeight(grams: number): { value: string; unit: string } {
  if (grams >= 1000) {
    return { value: (grams / 1000).toFixed(2), unit: 'kg' };
  }
  return { value: Math.round(grams).toString(), unit: 'g' };
}

interface GearItem {
  id: string;
  name: string;
  brand?: string;
  category: GearCategory | 'nutrition';
  weight?: number;
  weightUnit?: WeightUnit;
  notes?: string;
  quantity?: number;
  retired?: boolean;
}

export default function GearListScreen({ navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();

  const { gearItems, loading, deleteGearItem } = useGear();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | 'nutrition' | 'all'>('all');

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Data is already loaded via context
    }, [])
  );

  // Filter and group gear items
  const { sections, totalWeight, itemCount } = useMemo(() => {
    let filtered = gearItems.filter((item: GearItem) => !item.retired);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item: GearItem) =>
        item.name?.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item: GearItem) => item.category === selectedCategory);
    }

    // Calculate total weight
    let total = 0;
    filtered.forEach((item: GearItem) => {
      if (item.weight && item.weightUnit) {
        const qty = item.quantity || 1;
        total += toGrams(item.weight * qty, item.weightUnit);
      }
    });

    // Group by category
    const grouped: Record<string, GearItem[]> = {};
    filtered.forEach((item: GearItem) => {
      const cat = item.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    // Build sections in order
    const sectionList = CATEGORY_ORDER
      .filter(cat => grouped[cat]?.length > 0)
      .map(cat => ({
        title: CATEGORY_CONFIG[cat].label,
        icon: CATEGORY_CONFIG[cat].icon,
        category: cat,
        data: grouped[cat],
      }));

    return {
      sections: sectionList,
      totalWeight: total,
      itemCount: filtered.length,
    };
  }, [gearItems, searchQuery, selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const handleDeleteItem = (item: GearItem, index: number) => {
    Alert.alert(
      'Delete Gear',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const gearIndex = gearItems.findIndex((g: GearItem) => g.id === item.id);
            if (gearIndex !== -1) {
              await deleteGearItem(gearIndex);
            }
          },
        },
      ]
    );
  };

  const totalFormatted = formatWeight(totalWeight);

  const renderSectionHeader = ({ section }: { section: { title: string; icon: string; category: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.parchment }]}>
      <View style={[styles.sectionIcon, { backgroundColor: (themeColors.categories as any)[section.category] + '20' }]}>
        <Ionicons
          name={section.icon as any}
          size={16}
          color={(themeColors.categories as any)[section.category]}
        />
      </View>
      <H3 style={{ flex: 1 }}>{section.title}</H3>
      <BodySmall color="secondary">
        {sections.find(s => s.category === section.category)?.data.length} items
      </BodySmall>
    </View>
  );

  const renderItem = ({ item, index }: { item: GearItem; index: number }) => {
    const itemWeight = item.weight && item.weightUnit
      ? toGrams(item.weight * (item.quantity || 1), item.weightUnit)
      : 0;
    
    return (
      <Card
        variant="standard"
        style={styles.gearCard}
        onPress={() => navigation.navigate('GearDetail', { gearId: item.id, item })}
      >
        <CardContent>
          <View style={styles.gearRow}>
            <View style={styles.gearInfo}>
              <Text variant="h3">{item.name}</Text>
              {item.brand && (
                <BodySmall color="secondary">{item.brand}</BodySmall>
              )}
              {item.quantity && item.quantity > 1 && (
                <BodySmall color="tertiary">Qty: {item.quantity}</BodySmall>
              )}
            </View>
            
            <View style={styles.gearMeta}>
              {itemWeight > 0 && (
                <WeightBadge
                  weight={itemWeight}
                  unit="g"
                  size="md"
                />
              )}
              <TouchableOpacity
                onPress={() => navigation.navigate('EditGear', { gearId: item.id, item })}
                style={styles.editButton}
              >
                <Ionicons name="pencil" size={18} color={colors.trail} />
              </TouchableOpacity>
            </View>
          </View>
        </CardContent>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.trail + '20' }]}>
        <Ionicons name="cube-outline" size={48} color={colors.trail} />
      </View>
      <H2 style={{ marginTop: spacing.md }}>No Gear Yet</H2>
      <Body color="secondary" align="center" style={{ marginTop: spacing.xs, marginHorizontal: spacing.xl }}>
        Start building your gear closet by adding your first item.
      </Body>
      <Button
        style={{ marginTop: spacing.lg }}
        onPress={() => navigation.navigate('CreateGear')}
      >
        Add Your First Item
      </Button>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerTop}>
          <H1>Gear Closet</H1>
          <Button
            size="sm"
            onPress={() => navigation.navigate('CreateGear')}
            icon={<Ionicons name="add" size={18} color="#FFFFFF" />}
          >
            Add
          </Button>
        </View>

        {/* Total Weight Summary */}
        {itemCount > 0 && (
          <Card variant="elevated" style={styles.weightSummary}>
            <CardContent>
              <View style={styles.summaryRow}>
                <View>
                  <BodySmall color="secondary">Total Inventory</BodySmall>
                  <View style={styles.totalWeight}>
                    <Text variant="display" style={{ color: colors.forest }}>
                      {totalFormatted.value}
                    </Text>
                    <Text variant="h2" color="secondary" style={{ marginLeft: spacing.xs }}>
                      {totalFormatted.unit}
                    </Text>
                  </View>
                </View>
                <View style={styles.summaryStats}>
                  <View style={[styles.statBadge, { backgroundColor: colors.trail + '20' }]}>
                    <Text variant="mono" style={{ color: colors.trail }}>
                      {itemCount}
                    </Text>
                    <BodySmall color="secondary" style={{ marginLeft: 4 }}>items</BodySmall>
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
            placeholder="Search gear..."
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

        {/* Category Filter Pills */}
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
                backgroundColor: selectedCategory === 'all' ? colors.forest : colors.cream,
                borderColor: selectedCategory === 'all' ? colors.forest : colors.border,
              },
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text
              variant="bodySmall"
              style={{ color: selectedCategory === 'all' ? '#FFFFFF' : colors.stone }}
            >
              All
            </Text>
          </TouchableOpacity>
          
          {CATEGORY_ORDER.map(cat => {
            const config = CATEGORY_CONFIG[cat];
            const isSelected = selectedCategory === cat;
            const catColor = (themeColors.categories as any)[cat];
            
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? catColor : colors.cream,
                    borderColor: isSelected ? catColor : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Ionicons
                  name={config.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : catColor}
                  style={{ marginRight: 4 }}
                />
                <Text
                  variant="bodySmall"
                  style={{ color: isSelected ? '#FFFFFF' : colors.stone }}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Gear List */}
      {itemCount === 0 && !searchQuery && selectedCategory === 'all' ? (
        renderEmptyState()
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          stickySectionHeadersEnabled={false}
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
                No gear found matching your search.
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
  weightSummary: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalWeight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  summaryStats: {
    alignItems: 'flex-end',
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
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
  },
  listContent: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearCard: {
    marginBottom: 10,
  },
  gearRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gearInfo: {
    flex: 1,
  },
  gearMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editButton: {
    padding: 8,
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
