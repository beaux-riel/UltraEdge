/** V1 is a free, local planner. Billing services remain deferred. */
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { H1, Body } from '../../components/ui';

export function SubscriptionScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.parchment }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
    >
      <H1>Free race planning</H1>
      <Body style={styles.paragraph}>
        Events, checkpoints, gear, drop bags, crew contacts, GPX routes and PDF race plans
        are included. This version offers no purchases or subscriptions.
      </Body>
      <Body style={styles.paragraph}>
        Your editable plans are saved on this device. Export a PDF from your event to share
        with your crew and keep a copy outside the app before race day. A PDF is a readable
        copy, not a backup you can import to restore a plan.
      </Body>
      <Body color="secondary" style={styles.paragraph}>
        Optional live team rooms synchronize race timing and observations. GPS tracking, push notifications and automatic full-plan backups are not available. Map backgrounds may require an internet connection.
      </Body>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24 },
  paragraph: { marginTop: 20 },
});

export default SubscriptionScreen;
