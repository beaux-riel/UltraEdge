/**
 * UltraEdge Gear Detail Screen
 * View full details of a single gear item
 */

import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme';
import { Text, H1, H2, H3, Body, BodySmall, Button, Card, CardContent, WeightBadge, Label } from '../../components/ui';
import { useGear } from '../../context/GearContext';
import { colors as themeColors } from '../../theme/colors';
import type { GearCategory, WeightUnit } from '../../lib/database.types';

// Category configuration
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

interface GearItem {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  category: GearCategory | 'nutrition';
  weight?: number;
  weightUnit?: WeightUnit;
  color?: string;
  size?: string;
  notes?: string;
  quantity?: number;
  retired?: boolean;
  createdAt?: string;
}

export default function GearDetailScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();
  
  const { gearItems, deleteGearItem, updateGearItem } = useGear();

  // Get item from route params or find in context
  const item: GearItem = useMemo(() => {
    const passedItem = route.params?.item;
    const gearId = route.params?.gearId;
    
    if (passedItem) return passedItem;
    
    return gearItems.find((g: GearItem) => g.id === gearId) || null;
  }, [route.params, gearItems]);

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.bark} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.mist} />
          <H3 style={{ marginTop: spacing.md }}>Gear Not Found</H3>
          <Body color="secondary" style={{ marginTop: spacing.xs }}>
            This item may have been deleted.
          </Body>
          <Button style={{ marginTop: spacing.lg }} onPress={() => navigation.goBack()}>
            Go Back
          </Button>
        </View>
      </View>
    );
  }

  const categoryConfig = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
  const categoryColor = (themeColors.categories as any)[item.category] || colors.stone;

  const totalWeight = item.weight && item.weightUnit
    ? toGrams(item.weight * (item.quantity || 1), item.weightUnit)
    : 0;

  const handleEdit = () => {
    navigation.navigate('EditGear', { gearId: item.id, item });
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Delete Gear',
      `Are you sure you want to delete "${item.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const index = gearItems.findIndex((g: GearItem) => g.id === item.id);
            if (index !== -1) {
              await deleteGearItem(index);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handleRetire = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const action = item.retired ? 'restore' : 'retire';
    Alert.alert(
      `${item.retired ? 'Restore' : 'Retire'} Gear`,
      `${item.retired ? 'Restore' : 'Retire'} "${item.name}"? ${
        item.retired 
          ? 'It will appear in your gear list again.' 
          : 'It will be hidden from your gear list but can be restored later.'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: item.retired ? 'Restore' : 'Retire',
          onPress: async () => {
            const index = gearItems.findIndex((g: GearItem) => g.id === item.id);
            if (index !== -1) {
              await updateGearItem(index, { ...item, retired: !item.retired });
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.bark} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
            <Ionicons name="pencil" size={20} color={colors.trail} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={20} color={colors.clay} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
            <Ionicons name={categoryConfig.icon as any} size={24} color={categoryColor} />
          </View>
          
          <H1 style={{ marginTop: spacing.md, textAlign: 'center' }}>{item.name}</H1>
          
          {item.brand && (
            <Body color="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
              {item.brand}
            </Body>
          )}

          {/* Weight Hero */}
          {totalWeight > 0 && (
            <Card variant="elevated" style={styles.weightCard}>
              <CardContent>
                <View style={styles.weightDisplay}>
                  <Text variant="display" style={{ color: colors.forest }}>
                    {item.weight}
                  </Text>
                  <Text variant="h2" color="secondary" style={{ marginLeft: spacing.xs }}>
                    {item.weightUnit}
                  </Text>
                </View>
                
                {(item.quantity || 1) > 1 && (
                  <View style={styles.weightBreakdown}>
                    <BodySmall color="secondary">
                      {item.weight} {item.weightUnit} × {item.quantity} = {' '}
                    </BodySmall>
                    <WeightBadge
                      weight={totalWeight}
                      unit="g"
                      size="sm"
                    />
                  </View>
                )}
              </CardContent>
            </Card>
          )}
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <H3 style={{ marginBottom: spacing.md }}>Details</H3>
          
          <Card variant="standard">
            <CardContent>
              {/* Category */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Ionicons name="pricetag-outline" size={18} color={colors.mist} />
                  <BodySmall color="secondary" style={{ marginLeft: 8 }}>Category</BodySmall>
                </View>
                <View style={[styles.categoryTag, { backgroundColor: categoryColor + '20' }]}>
                  <Ionicons name={categoryConfig.icon as any} size={14} color={categoryColor} />
                  <Text variant="bodySmall" style={{ color: categoryColor, marginLeft: 6 }}>
                    {categoryConfig.label}
                  </Text>
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Ionicons name="layers-outline" size={18} color={colors.mist} />
                  <BodySmall color="secondary" style={{ marginLeft: 8 }}>Quantity</BodySmall>
                </View>
                <Text variant="body">{item.quantity || 1}</Text>
              </View>

              {/* Model */}
              {item.model && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabel}>
                    <Ionicons name="information-circle-outline" size={18} color={colors.mist} />
                    <BodySmall color="secondary" style={{ marginLeft: 8 }}>Model</BodySmall>
                  </View>
                  <Text variant="body">{item.model}</Text>
                </View>
              )}

              {/* Color */}
              {item.color && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabel}>
                    <Ionicons name="color-palette-outline" size={18} color={colors.mist} />
                    <BodySmall color="secondary" style={{ marginLeft: 8 }}>Color</BodySmall>
                  </View>
                  <Text variant="body">{item.color}</Text>
                </View>
              )}

              {/* Size */}
              {item.size && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabel}>
                    <Ionicons name="resize-outline" size={18} color={colors.mist} />
                    <BodySmall color="secondary" style={{ marginLeft: 8 }}>Size</BodySmall>
                  </View>
                  <Text variant="body">{item.size}</Text>
                </View>
              )}

              {/* Status */}
              {item.retired && (
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <View style={styles.detailLabel}>
                    <Ionicons name="archive-outline" size={18} color={colors.mist} />
                    <BodySmall color="secondary" style={{ marginLeft: 8 }}>Status</BodySmall>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: colors.sunset + '20' }]}>
                    <Text variant="bodySmall" style={{ color: colors.sunset }}>
                      Retired
                    </Text>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        </View>

        {/* Notes Section */}
        {item.notes && (
          <View style={styles.notesSection}>
            <H3 style={{ marginBottom: spacing.md }}>Notes</H3>
            <Card variant="standard">
              <CardContent>
                <Body>{item.notes}</Body>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            variant="secondary"
            fullWidth
            onPress={handleEdit}
            icon={<Ionicons name="pencil" size={18} color={colors.trail} />}
          >
            Edit Item
          </Button>
          
          <Button
            variant="tertiary"
            fullWidth
            onPress={handleRetire}
            style={{ marginTop: spacing.sm }}
          >
            {item.retired ? 'Restore Item' : 'Retire Item'}
          </Button>
          
          <Button
            variant="danger"
            fullWidth
            onPress={handleDelete}
            style={{ marginTop: spacing.sm }}
            icon={<Ionicons name="trash-outline" size={18} color="#FFFFFF" />}
          >
            Delete Item
          </Button>
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightCard: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  weightBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  notesSection: {
    marginBottom: 24,
  },
  actionsSection: {
    marginTop: 8,
  },
});
