/**
 * UltraEdge Create Gear Screen
 * Form to add new gear items to the master inventory
 */

import React, { useState } from 'react';
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
import uuid from 'react-native-uuid';

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

export default function CreateGearScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { colors, spacing, radius } = theme;
  const insets = useSafeAreaInsets();
  
  const { addGearItem } = useGear();

  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<GearCategory | 'nutrition'>('other');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('g');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const newItem = {
        name: name.trim(),
        brand: brand.trim() || undefined,
        category,
        weight: weight ? parseFloat(weight) : undefined,
        weightUnit,
        quantity: parseInt(quantity) || 1,
        notes: notes.trim() || undefined,
        retired: false,
        isActive: true,
      };

      await addGearItem(newItem);
      
      Alert.alert(
        'Gear Added',
        `"${name}" has been added to your gear closet.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to save gear item:', error);
      Alert.alert('Error', 'Failed to save gear item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const current = parseInt(quantity) || 1;
    const newVal = Math.max(1, current + delta);
    setQuantity(newVal.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.parchment }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color={colors.bark} />
        </TouchableOpacity>
        <H2>Add Gear</H2>
        <Button
          size="sm"
          onPress={handleSave}
          disabled={!canSave}
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
            autoFocus
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
          <BodySmall color="tertiary" style={{ marginTop: spacing.xs }}>
            Weight per item (not including quantity)
          </BodySmall>
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
              <BodySmall color="secondary">Total Weight Preview</BodySmall>
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
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
});
