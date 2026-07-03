/**
 * UltraEdge Crew Detail Screen
 * View full details of a single crew member
 */

import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../theme';
import { Text, H1, H3, Body, BodySmall, Button, Card, CardContent } from '../../components/ui';
import { useCrewMembers, ROLE_CONFIG } from '../../context/CrewContext';

export default function CrewDetailScreen({ navigation, route }: any) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  const { crewMembers, deleteCrewMember } = useCrewMembers();

  // Get crew member from context
  const member = useMemo(() => {
    const crewId = route.params?.crewId;
    return crewMembers.find((m) => m.id === crewId) || null;
  }, [route.params?.crewId, crewMembers]);

  if (!member) {
    return (
      <View style={[styles.container, { backgroundColor: colors.parchment }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.borderLight }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.bark} />
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

  const roleConfig = ROLE_CONFIG[member.role];
  const displayRole = member.role === 'other' && member.customRole
    ? member.customRole
    : roleConfig.label;

  // Get initials for avatar
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const handleEdit = () => {
    navigation.navigate('EditCrew', { crewId: member.id });
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Crew Member',
      `Are you sure you want to remove "${member.name}" from your crew? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCrewMember(member.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCall = () => {
    if (member.phone) {
      Linking.openURL(`tel:${member.phone}`);
    }
  };

  const handleText = () => {
    if (member.phone) {
      Linking.openURL(`sms:${member.phone}`);
    }
  };

  const handleEmail = () => {
    if (member.email) {
      Linking.openURL(`mailto:${member.email}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm, borderBottomColor: colors.borderLight }]}>
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
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: roleConfig.color + '20' }]}>
            {member.avatar_url ? (
              <Ionicons name="person" size={48} color={roleConfig.color} />
            ) : (
              <Text variant="display" style={{ color: roleConfig.color }}>
                {getInitials(member.name)}
              </Text>
            )}
          </View>

          <H1 style={{ marginTop: spacing.md, textAlign: 'center' }}>{member.name}</H1>

          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: roleConfig.color + '20' }]}>
            <Ionicons name={roleConfig.icon as any} size={18} color={roleConfig.color} />
            <Text variant="body" style={{ color: roleConfig.color, marginLeft: 8 }}>
              {displayRole}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        {(member.phone || member.email) && (
          <View style={styles.quickActions}>
            {member.phone && (
              <>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.forest + '15' }]}
                  onPress={handleCall}
                >
                  <Ionicons name="call" size={22} color={colors.forest} />
                  <BodySmall style={{ color: colors.forest, marginTop: 4 }}>Call</BodySmall>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.trail + '15' }]}
                  onPress={handleText}
                >
                  <Ionicons name="chatbubble" size={22} color={colors.trail} />
                  <BodySmall style={{ color: colors.trail, marginTop: 4 }}>Text</BodySmall>
                </TouchableOpacity>
              </>
            )}
            {member.email && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.sky + '15' }]}
                onPress={handleEmail}
              >
                <Ionicons name="mail" size={22} color={colors.sky} />
                <BodySmall style={{ color: colors.sky, marginTop: 4 }}>Email</BodySmall>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Contact Details */}
        <View style={styles.detailsSection}>
          <H3 style={{ marginBottom: spacing.md }}>Contact Information</H3>

          <Card variant="standard">
            <CardContent>
              {/* Phone */}
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Ionicons name="call-outline" size={18} color={colors.mist} />
                  <BodySmall color="secondary" style={{ marginLeft: 8 }}>Phone</BodySmall>
                </View>
                <Text variant="body">
                  {member.phone || '—'}
                </Text>
              </View>

              {/* Email */}
              <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                <View style={styles.detailLabel}>
                  <Ionicons name="mail-outline" size={18} color={colors.mist} />
                  <BodySmall color="secondary" style={{ marginLeft: 8 }}>Email</BodySmall>
                </View>
                <Text variant="body" style={{ flex: 1, textAlign: 'right' }} numberOfLines={1}>
                  {member.email || '—'}
                </Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Notes Section */}
        {member.notes && (
          <View style={styles.notesSection}>
            <H3 style={{ marginBottom: spacing.md }}>Notes</H3>
            <Card variant="standard">
              <CardContent>
                <Body>{member.notes}</Body>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Events Section (Future Feature Placeholder) */}
        <View style={styles.eventsSection}>
          <H3 style={{ marginBottom: spacing.md }}>Assigned Events</H3>
          <Card variant="standard">
            <CardContent>
              <View style={styles.placeholderContent}>
                <Ionicons name="calendar-outline" size={32} color={colors.mist} />
                <Body color="secondary" style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                  Event assignments coming soon!
                </Body>
                <BodySmall color="tertiary" style={{ marginTop: spacing.xs, textAlign: 'center' }}>
                  You'll be able to assign crew members to specific events and checkpoints.
                </BodySmall>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            variant="secondary"
            fullWidth
            onPress={handleEdit}
            icon={<Ionicons name="pencil" size={18} color={colors.trail} />}
          >
            Edit Crew Member
          </Button>

          <Button
            variant="danger"
            fullWidth
            onPress={handleDelete}
            style={{ marginTop: spacing.sm }}
            icon={<Ionicons name="trash-outline" size={18} color={colors.snow} />}
          >
            Remove from Crew
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 16,
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
  },
  detailLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notesSection: {
    marginBottom: 24,
  },
  eventsSection: {
    marginBottom: 24,
  },
  placeholderContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionsSection: {
    marginTop: 8,
  },
});
