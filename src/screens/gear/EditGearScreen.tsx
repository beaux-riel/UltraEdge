/**
 * UltraEdge Edit Gear Screen
 * Form to edit existing gear items
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme';
import { Text, H1, H2, H3, Body, BodySmall, Button, Card, CardContent, Label } from '../../components/ui';
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

const CATEGORIES: (GearCategory | 'nutrition')[] = [
  'pack', 'footwear', 'clothing', 'hydration', 'lighting',
  'navigation', 'safety', 'poles', 'nutrition', 'other',
];

const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'oz', label: 'oz' },
  { value: 'kg', label: 'kg' },
  { value: 'lbs', label: 'lbs' },
];

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
}

export default function EditGearScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();
  
  const { gearItems, updateGearItem, deleteGearItem } = useGear();

  // Get item from route params or find in context
  const originalItem: GearItem | null = useMemo(() => {
    const passedItem = route.params?.item;
    const gearId = route.params?.gearId;
    
    if (passedItem) return passedItem;
    
    return gearItems.find((g: GearItem) => g.id === gearId) || null;
  }, [route.params?.gearId]);

  // Form state
  const [name, setName] = useState(originalItem?.name || '');
  const [brand, setBrand] = useState(originalItem?.brand || '');
  const [model, setModel] = useState(originalItem?.model || '');
  const [category, setCategory] = useState<GearCategory | 'nutrition'>(originalItem?.category || 'other');
  const [weight, setWeight] = useState(originalItem?.weight?.toString() || '');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(originalItem?.weightUnit || 'g');
  const [quantity, setQuantity] = useState((originalItem?.quantity || 1).toString());
  const [color, setColor] = useState(originalItem?.color || '');
  const [size, setSize] = useState(originalItem?.size || '');
  const [notes, setNotes] = useState(originalItem?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!originalItem) {
    return (
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.bark} />
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

  const canSave = name.trim().length > 0;

  const hasChanges = 
    name !== originalItem.name ||
    brand !== (originalItem.brand || '') ||
    model !== (originalItem.model || '') ||
    category !== originalItem.category ||
    weight !== (originalItem.weight?.toString() || '') ||
    weightUnit !== (originalItem.weightUnit || 'g') ||
    quantity !== (originalItem.quantity || 1).toString() ||
    color !== (originalItem.color || '') ||
    size !== (originalItem.size || '') ||
    notes !== (originalItem.notes || '');

  const handleSave = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const updatedItem = {
        ...originalItem,
        name: name.trim(),
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        category,
        weight: weight ? parseFloat(weight) : undefined,
        weightUnit: weight ? weightUnit : undefined,
        quantity: parseInt(quantity) || 1,
        color: color.trim() || undefined,
        size: size.trim() || undefined,
        notes: notes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };

      await updateGearItem(originalItem.id, updatedItem);
      
      Alert.alert(
        'Gear Updated',
        `"${name}" has been updated.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to update gear item:', error);
      Alert.alert('Error', 'Failed to update gear item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Delete Gear',
      `Are you sure you want to delete "${originalItem.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteGearItem(originalItem.id);
            // Go back twice to exit both edit and detail screens
            navigation.popToTop();
          },
        },
      ]
    );
  };

  const handleQuantityChange = (delta: number) => {
    const current = parseInt(quantity) || 1;
    const newVal = Math.max(1, current + delta);
    setQuantity(newVal.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDiscard = () => {
    if (!hasChanges) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.parchment }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={handleDiscard} style={styles.backButton}>
          <Ionicons name="close" size={24} color={colors.bark} />
        </TouchableOpacity>
        <H2>Edit Gear</H2>
        <Button
          size="sm"
          onPress={handleSave}
          disabled={!canSave || !hasChanges}
          loading={saving}
        >
          Save
        </Button>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name */}
        <View style={styles.field}>
          <Label>Name *</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
              },
            ]}
            placeholder="e.g., Salomon Sense Ride 5"
            placeholderTextColor={colors.mist}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Brand */}
        <View style={styles.field}>
          <Label>Brand</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
              },
            ]}
            placeholder="e.g., Salomon"
            placeholderTextColor={colors.mist}
            value={brand}
            onChangeText={setBrand}
          />
        </View>

        {/* Model */}
        <View style={styles.field}>
          <Label>Model</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
              },
            ]}
            placeholder="e.g., Sense Ride 5"
            placeholderTextColor={colors.mist}
            value={model}
            onChangeText={setModel}
          />
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Label>Category</Label>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const isSelected = category === cat;
              const catColor = (themeColors.categories as any)[cat];

              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: isSelected ? catColor : colors.cream,
                      borderColor: isSelected ? catColor : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setCategory(cat);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons
                    name={config.icon as any}
                    size={18}
                    color={isSelected ? '#FFFFFF' : catColor}
                  />
                  <Text
                    variant="bodySmall"
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.stone,
                      marginTop: 4,
                    }}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Weight */}
        <View style={styles.field}>
          <Label>Weight</Label>
          <View style={styles.weightRow}>
            <TextInput
              style={[
                styles.input,
                styles.weightInput,
                {
                  backgroundColor: colors.cream,
                  borderColor: colors.border,
                  color: colors.bark,
                },
              ]}
              placeholder="0"
              placeholderTextColor={colors.mist}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
            <View style={styles.unitPicker}>
              {WEIGHT_UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit.value}
                  style={[
                    styles.unitButton,
                    {
                      backgroundColor: weightUnit === unit.value ? colors.trail : colors.cream,
                      borderColor: weightUnit === unit.value ? colors.trail : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setWeightUnit(unit.value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text
                    variant="bodySmall"
                    style={{
                      color: weightUnit === unit.value ? '#FFFFFF' : colors.stone,
                      fontWeight: '600',
                    }}
                  >
                    {unit.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Quantity */}
        <View style={styles.field}>
          <Label>Quantity</Label>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                { backgroundColor: colors.cream, borderColor: colors.border },
              ]}
              onPress={() => handleQuantityChange(-1)}
            >
              <Ionicons name="remove" size={20} color={colors.trail} />
            </TouchableOpacity>
            <TextInput
              style={[
                styles.quantityInput,
                {
                  backgroundColor: colors.cream,
                  borderColor: colors.border,
                  color: colors.bark,
                },
              ]}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={[
                styles.quantityButton,
                { backgroundColor: colors.cream, borderColor: colors.border },
              ]}
              onPress={() => handleQuantityChange(1)}
            >
              <Ionicons name="add" size={20} color={colors.trail} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Color */}
        <View style={styles.field}>
          <Label>Color (optional)</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
              },
            ]}
            placeholder="e.g., Black/Red"
            placeholderTextColor={colors.mist}
            value={color}
            onChangeText={setColor}
          />
        </View>

        {/* Size */}
        <View style={styles.field}>
          <Label>Size (optional)</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
              },
            ]}
            placeholder="e.g., Large, 42, M/L"
            placeholderTextColor={colors.mist}
            value={size}
            onChangeText={setSize}
          />
        </View>

        {/* Notes */}
        <View style={styles.field}>
          <Label>Notes</Label>
          <TextInput
            style={[
              styles.input,
              styles.notesInput,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
              },
            ]}
            placeholder="Any additional details..."
            placeholderTextColor={colors.mist}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Weight Preview */}
        {weight && parseFloat(weight) > 0 && (
          <Card variant="standard" style={styles.previewCard}>
            <CardContent>
              <BodySmall color="secondary">Total Weight</BodySmall>
              <View style={styles.previewRow}>
                <Text variant="h2" style={{ color: colors.forest }}>
                  {(parseFloat(weight) * (parseInt(quantity) || 1)).toFixed(1)}
                </Text>
                <Text variant="body" color="secondary" style={{ marginLeft: 4 }}>
                  {weightUnit}
                </Text>
                {parseInt(quantity) > 1 && (
                  <BodySmall color="tertiary" style={{ marginLeft: spacing.sm }}>
                    ({weight} {weightUnit} × {quantity})
                  </BodySmall>
                )}
              </View>
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <Label style={{ color: colors.clay }}>Danger Zone</Label>
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
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    padding: 4,
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
  field: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  categoryButton: {
    width: '30%',
    aspectRatio: 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 8,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  weightInput: {
    flex: 1,
    marginTop: 0,
  },
  unitPicker: {
    flexDirection: 'row',
    gap: 6,
  },
  unitButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 80,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  previewCard: {
    marginTop: 8,
    marginBottom: 24,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  dangerZone: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});
