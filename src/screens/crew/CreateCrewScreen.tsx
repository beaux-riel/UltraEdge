/**
 * UltraEdge Create Crew Screen
 * Form to add new crew members
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

import { useTheme } from '../../theme';
import { H2, Body, BodySmall, Button, Card, CardContent, Label } from '../../components/ui';
import { useCrewMembers } from '../../context/CrewContext';

export default function CreateCrewScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  const { createCrewMember } = useCrewMembers();

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = name.trim().length > 0;

  const handleSave = async () => {
    if (!canSave || saving) return;

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await createCrewMember({
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        notes: notes.trim() || null,
      });

      Alert.alert(
        'Crew Member Added',
        `${name} has been added to your crew.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to save crew member:', error);
      Alert.alert('Error', 'Failed to save crew member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.parchment }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.borderLight }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color={colors.bark} />
        </TouchableOpacity>
        <H2>Add Crew Member</H2>
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
            placeholder="e.g., John Smith"
            placeholderTextColor={colors.mist}
            value={name}
            onChangeText={setName}
            autoFocus
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

        {/* Roles Info Card */}
        <Card variant="standard" style={styles.infoCard}>
          <CardContent>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle-outline" size={20} color={colors.trail} />
              <Body style={{ flex: 1, marginLeft: spacing.sm, fontWeight: '600' }}>
                Roles are set per event
              </Body>
            </View>
            <BodySmall color="secondary">
              Assign this person to an event to give them roles like Pacer, Crew Chief,
              or Driver — they can hold different roles for different races.
            </BodySmall>
          </CardContent>
        </Card>
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
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  infoCard: {
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
});
