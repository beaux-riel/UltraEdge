/**
 * UltraEdge About Screen
 * A note from the founder
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

import { useTheme } from '../../theme';
import { H2, Body, BodySmall, Caption, Card, CardContent } from '../../components/ui';

interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
}

function SectionHeader({ icon, tint, title }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: `${tint}15` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <H2 style={styles.sectionTitle}>{title}</H2>
    </View>
  );
}

export default function AboutScreen() {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.parchment }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: `${colors.forest}15` }]}>
          <Ionicons name="trail-sign-outline" size={36} color={colors.forest} />
        </View>
        <Caption style={{ marginTop: spacing.md }}>A NOTE FROM THE FOUNDER</Caption>
      </View>

      <Card style={{ marginBottom: spacing.lg }}>
        <CardContent>
          <SectionHeader icon="footsteps-outline" tint={colors.forest} title="Miles in My Legs" />
          <Body color="secondary">
            I&apos;m Beaux, and I&apos;ve spent a lot of long days and longer nights out on
            trails. Ultra running taught me that races aren&apos;t won at mile 80 — they&apos;re
            won in the weeks before, in the quiet work of planning: knowing your gear, your
            splits, your crew stops, and what&apos;s waiting in each drop bag. UltraEdge grew
            out of the spreadsheets and scribbled notes I carried into every race.
          </Body>
        </CardContent>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <CardContent>
          <SectionHeader icon="heart-outline" tint={colors.clay} title="This Community" />
          <Body color="secondary">
            The best part of this sport has never been the finish lines — it&apos;s the people.
            The aid station volunteers at 3am, the crews huddled under headlamps, the stranger
            who shares their last gel with you. The running community shows up for each other,
            and I wanted to build something that shows up for it in return.
          </Body>
        </CardContent>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <CardContent>
          <H2 style={{ marginBottom: spacing.sm }}>What I Learned at On</H2>
          <Body color="secondary">
            Working as a tech rep for On, the Swiss running brand, I got to talk with runners
            every single day — in shops, at races, on group runs. I saw firsthand how much the
            right tool at the right moment matters, and how often runners are left piecing
            things together on their own. Great gear deserves great planning to go with it.
          </Body>
        </CardContent>
      </Card>

      <Card style={{ marginBottom: spacing.lg }}>
        <CardContent>
          <H2 style={{ marginBottom: spacing.sm }}>One Tool Among Many</H2>
          <Body color="secondary">
            UltraEdge isn&apos;t trying to be everything. It&apos;s one tool in a kit the
            running community deserves — built so you and your crew can show up on race day
            prepared, calm, and free to focus on the only thing that matters: moving forward.
          </Body>
        </CardContent>
      </Card>

      {/* Sign-off */}
      <View style={styles.signOff}>
        <Body style={{ color: colors.forest, fontStyle: 'italic' }}>
          See you on the trail.
        </Body>
        <BodySmall color="secondary" style={{ marginTop: spacing.xs }}>
          — Beaux
        </BodySmall>
      </View>

      {/* Version footer */}
      <View style={styles.versionFooter}>
        <Caption>
          UltraEdge v{Constants.expoConfig?.version ?? '1.0.0'}
        </Caption>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOff: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  versionFooter: {
    alignItems: 'center',
    marginTop: 8,
  },
});
