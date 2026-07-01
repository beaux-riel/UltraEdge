/**
 * UltraEdge Edit Crew Screen
 * Form to edit existing crew members
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
import { Text, H2, H3, Body, BodySmall, Button, Label } from '../../components/ui';
import { useCrewMembers, ROLE_CONFIG, ROLES, CrewRole } from '../../context/CrewContext';

export default function EditCrewScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  const { crewMembers, updateCrewMember, deleteCrewMember } = useCrewMembers();

  // Get original crew member from context
  const originalMember = useMemo(() => {
    const crewId = route.params?.crewId;
    return crewMembers.find((m) => m.id === crewId) || null;
  }, [route.params?.crewId, crewMembers]);

  // Form state
  const [name, setName] = useState(originalMember?.name || '');
  const [phone, setPhone] = useState(originalMember?.phone || '');
  const [email, setEmail] = useState(originalMember?.email || '');
  const [role, setRole] = useState<CrewRole>(originalMember?.role || 'pacer');
  const [customRole, setCustomRole] = useState(originalMember?.customRole || '');
  const [notes, setNotes] = useState(originalMember?.notes || '');
  const [saving, setSaving] = useState(false);

  if (!originalMember) {
    return (
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={colors.bark} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.mist} />
          <H3 style={{ marginTop: spacing.md }}>Crew Member Not Found</H3>
          <Body color="secondary" style={{ marginTop: spacing.xs }}>
            This crew member may have been deleted.
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
    name !== originalMember.name ||
    phone !== (originalMember.phone || '') ||
    email !== (originalMember.email || '') ||
    role !== originalMember.role ||
    customRole !== (originalMember.customRole || '') ||
    notes !== (originalMember.notes || '');

  const handleSave = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await updateCrewMember(originalMember.id, {
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        role,
        customRole: role === 'other' ? customRole.trim() || null : null,
        notes: notes.trim() || null,
      });

      Alert.alert(
        'Crew Member Updated',
        `${name} has been updated.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to update crew member:', error);
      Alert.alert('Error', 'Failed to update crew member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Crew Member',
      `Are you sure you want to remove "${originalMember.name}" from your crew? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCrewMember(originalMember.id);
            // Go back to list
            navigation.popToTop();
          },
        },
      ]
    );
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
        <H2>Edit Crew Member</H2>
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
            placeholder="e.g., John Smith"
            placeholderTextColor={colors.mist}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Phone */}
        <View style={styles.field}>
          <Label>Phone</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
              },
            ]}
            placeholder="e.g., (555) 123-4567"
            placeholderTextColor={colors.mist}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Label>Email</Label>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.cream,
                borderColor: colors.border,
                color: colors.bark,
              },
            ]}
            placeholder="e.g., john@example.com"
            placeholderTextColor={colors.mist}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Role */}
        <View style={styles.field}>
          <Label>Role</Label>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => {
              const config = ROLE_CONFIG[r];
              const isSelected = role === r;

              return (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: isSelected ? config.color : colors.cream,
                      borderColor: isSelected ? config.color : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setRole(r);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons
                    name={config.icon as any}
                    size={22}
                    color={isSelected ? '#FFFFFF' : config.color}
                  />
                  <Text
                    variant="bodySmall"
                    style={{
                      color: isSelected ? '#FFFFFF' : colors.stone,
                      marginTop: 6,
                      textAlign: 'center',
                    }}
                  >
                    {config.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Custom Role (if Other selected) */}
        {role === 'other' && (
          <View style={styles.field}>
            <Label>Custom Role</Label>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cream,
                  borderColor: colors.border,
                  color: colors.bark,
                },
              ]}
              placeholder="e.g., Support Runner"
              placeholderTextColor={colors.mist}
              value={customRole}
              onChangeText={setCustomRole}
              autoCapitalize="words"
            />
          </View>
        )}

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
            placeholder="Any additional details about this crew member..."
            placeholderTextColor={colors.mist}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

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
            Remove from Crew
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
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  roleButton: {
    width: '31%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 8,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  dangerZone: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
});
