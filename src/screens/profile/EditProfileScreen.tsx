/**
 * UltraEdge Edit Profile Screen
 * Edit display name and unit preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme';
import {
  Text,
  H2,
  Body,
  BodySmall,
  Caption,
  Label,
  Button,
  Card,
  CardContent,
} from '../../components/ui';
import { useMover } from '../../context/MoverContext';
import type { DistanceUnit, ElevationUnit, WeightUnit } from '../../lib/database.types';

// ============================================================================
// TYPES
// ============================================================================

interface UnitOption<T> {
  value: T;
  label: string;
  description: string;
}

const WEIGHT_UNITS: UnitOption<WeightUnit>[] = [
  { value: 'lbs', label: 'Pounds (lbs)', description: 'US standard' },
  { value: 'kg', label: 'Kilograms (kg)', description: 'Metric standard' },
];

const DISTANCE_UNITS: UnitOption<DistanceUnit>[] = [
  { value: 'miles', label: 'Miles', description: 'US standard' },
  { value: 'kilometers', label: 'Kilometers', description: 'Metric standard' },
];

const ELEVATION_UNITS: UnitOption<ElevationUnit>[] = [
  { value: 'feet', label: 'Feet', description: 'US standard' },
  { value: 'meters', label: 'Meters', description: 'Metric standard' },
];

// ============================================================================
// UNIT SELECTOR COMPONENT
// ============================================================================

interface UnitSelectorProps<T> {
  title: string;
  options: UnitOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  colors: any;
}

function UnitSelector<T extends string>({
  title,
  options,
  selected,
  onSelect,
  colors,
}: UnitSelectorProps<T>) {
  return (
    <View style={styles.unitSection}>
      <Label style={{ marginBottom: 12 }}>{title}</Label>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.unitOption,
              {
                backgroundColor: isSelected ? `${colors.forest}10` : colors.surface,
                borderColor: isSelected ? colors.forest : colors.border,
              },
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <View style={styles.unitOptionContent}>
              <View style={{ flex: 1 }}>
                <Body style={isSelected ? { color: colors.forest, fontWeight: '600' } : undefined}>
                  {option.label}
                </Body>
                <BodySmall color="tertiary">{option.description}</BodySmall>
              </View>
              {isSelected && (
                <View style={[styles.checkmark, { backgroundColor: colors.forest }]}>
                  <Ionicons name="checkmark" size={16} color={colors.snow} />
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function EditProfileScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const insets = useSafeAreaInsets();
  
  const { profile, updateProfile } = useMover();
  
  // Form state
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(profile.weight_unit);
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>(profile.distance_unit);
  const [elevationUnit, setElevationUnit] = useState<ElevationUnit>(profile.elevation_unit);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track if changes were made
  const hasChanges = 
    displayName !== profile.display_name ||
    weightUnit !== profile.weight_unit ||
    distanceUnit !== profile.distance_unit ||
    elevationUnit !== profile.elevation_unit;

  // Handle save
  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Name Required', 'Please enter a display name.');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim(),
        weight_unit: weightUnit,
        distance_unit: distanceUnit,
        elevation_unit: elevationUnit,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Confirm discard changes
  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + spacing.sm,
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={24} color={colors.forest} />
            <Text style={{ color: colors.forest, marginLeft: 4 }}>Back</Text>
          </TouchableOpacity>
          
          <H2>Edit Profile</H2>
          
          <TouchableOpacity
            style={[
              styles.headerButton,
              { opacity: hasChanges && !isSaving ? 1 : 0.5 }
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Text style={{ color: colors.forest, fontWeight: '600' }}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Display Name */}
          <View style={styles.section}>
            <Label style={{ marginBottom: 12 }}>DISPLAY NAME</Label>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Ionicons name="person-outline" size={20} color={colors.stone} style={{ marginRight: 12 }} />
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.bark,
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor={colors.mist}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={50}
              />
            </View>
            <Caption style={{ marginTop: 8 }}>
              This is how you'll be identified in UltraEdge. You're a Mover!
            </Caption>
          </View>

          {/* Weight Unit */}
          <View style={styles.section}>
            <UnitSelector
              title="WEIGHT UNIT"
              options={WEIGHT_UNITS}
              selected={weightUnit}
              onSelect={setWeightUnit}
              colors={colors}
            />
            <Caption style={{ marginTop: 8 }}>
              Used for body weight tracking and gear weight calculations.
            </Caption>
          </View>

          {/* Distance Unit */}
          <View style={styles.section}>
            <UnitSelector
              title="DISTANCE UNIT"
              options={DISTANCE_UNITS}
              selected={distanceUnit}
              onSelect={setDistanceUnit}
              colors={colors}
            />
            <Caption style={{ marginTop: 8 }}>
              Used for event distances and checkpoint locations.
            </Caption>
          </View>

          {/* Elevation Unit */}
          <View style={styles.section}>
            <UnitSelector
              title="ELEVATION UNIT"
              options={ELEVATION_UNITS}
              selected={elevationUnit}
              onSelect={setElevationUnit}
              colors={colors}
            />
            <Caption style={{ marginTop: 8 }}>
              Used for elevation gain/loss in events.
            </Caption>
          </View>

          {/* Quick Actions */}
          <View style={[styles.section, { marginTop: spacing.lg }]}>
            <Card>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  Alert.alert(
                    'Set All to Metric',
                    'This will change all units to metric (kg, km, m).',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Apply',
                        onPress: () => {
                          setWeightUnit('kg');
                          setDistanceUnit('kilometers');
                          setElevationUnit('meters');
                        },
                      },
                    ]
                  );
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.sky}15` }]}>
                  <Ionicons name="globe-outline" size={20} color={colors.sky} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body>Use Metric Units</Body>
                  <BodySmall color="secondary">kg, km, meters</BodySmall>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mist} />
              </TouchableOpacity>
              
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => {
                  Alert.alert(
                    'Set All to Imperial',
                    'This will change all units to imperial (lbs, miles, feet).',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Apply',
                        onPress: () => {
                          setWeightUnit('lbs');
                          setDistanceUnit('miles');
                          setElevationUnit('feet');
                        },
                      },
                    ]
                  );
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${colors.trail}15` }]}>
                  <Ionicons name="flag-outline" size={20} color={colors.trail} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body>Use Imperial Units</Body>
                  <BodySmall color="secondary">lbs, miles, feet</BodySmall>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.mist} />
              </TouchableOpacity>
            </Card>
          </View>
        </ScrollView>

        {/* Bottom Save Button (for accessibility) */}
        {hasChanges && (
          <View
            style={[
              styles.bottomBar,
              {
                paddingBottom: insets.bottom + spacing.md,
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
              },
            ]}
          >
            <Button
              onPress={handleSave}
              loading={isSaving}
              fullWidth
            >
              Save Changes
            </Button>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 60,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 28,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  unitSection: {},
  unitOption: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  unitOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
