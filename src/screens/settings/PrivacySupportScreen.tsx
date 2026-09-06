/** Offline-readable information for the free local V1 release. */
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { H2, Body, BodySmall } from '../../components/ui';

const SUPPORT_URL = 'https://ultraedge.heybeaux.dev/support';
const PRIVACY_URL = 'https://ultraedge.heybeaux.dev/privacy';
const PRIVATE_EMAIL = 'hello@heybeaux.dev';

export default function PrivacySupportScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const openLink = async (url:string, label:string) => {
    try { await Linking.openURL(url); }
    catch {
      Alert.alert(`Could not open ${label}`, `Connect to the internet and try again, or visit ${url} in your browser.`);
    }
  };
  const openPrivateEmail = async () => {
    try { await Linking.openURL(`mailto:${PRIVATE_EMAIL}`); }
    catch {
      Alert.alert('Could not open email', `Open your email app and write to ${PRIVATE_EMAIL} for private privacy, support or abuse concerns. UltraEdge has not sent an email.`);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.parchment }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
    >
      <BodySmall>UltraEdge 1.0 · Updated September 6, 2026</BodySmall>
      <Body style={styles.paragraph}>This information is available offline. Opening policy or support links requires an internet connection.</Body>
      <TouchableOpacity accessibilityRole="link" accessibilityLabel="Open UltraEdge privacy policy" onPress={() => { void openLink(PRIVACY_URL,'privacy policy'); }} style={styles.link}>
        <Body style={{ color: theme.colors.forest, textDecorationLine: 'underline' }}>Privacy policy</Body>
      </TouchableOpacity>

      <View style={styles.section}>
        <H2 accessibilityRole="header">Your plans stay on this device</H2>
        <Body style={styles.paragraph}>
          UltraEdge stores your event plans, checkpoints, gear, drop bags, crew names and contact details,
          roles, notes, profile, weight entries, preferences and imported GPX files locally.
          The free planner has no purchases, advertising,
          or app-operated analytics and crash reporting enabled.
        </Body>
        <Body style={styles.paragraph}>
          UltraEdge does not provide automatic plan backups or editable-plan transfer or restore.
          Your operating system may include app data in device backups according to your settings.
        </Body>
      </View>

      <View style={styles.section}>
        <H2 accessibilityRole="header">Maps, files and sharing</H2>
        <Body style={styles.paragraph}>
          Saved plans and locally imported routes can be read offline. Map backgrounds may request
          data for the area you view through the device’s map service. File and photo pickers supply
          items you select; a file stored with a cloud provider may need to download first.
          External websites and services follow their own privacy practices.
        </Body>
        <Body style={styles.paragraph}>
          PDF exports can include crew contacts, route details and notes. You choose whether and where
          to share them using the system share sheet. Review the PDF before sharing. People and services
          receiving a copy control that copy; deleting a plan does not delete copies you shared.
        </Body>
        <Body style={styles.paragraph}>
          Before race day, save a PDF outside the app and keep your original GPX file separately.
          Check both in airplane mode. A PDF is a readable copy and cannot restore an editable plan.
          UltraEdge does not provide live tracking, crew notifications or turn-by-turn navigation.
        </Body>
      </View>

      <View style={styles.section}>
        <H2 accessibilityRole="header">If a change does not save</H2>
        <Body style={styles.paragraph}>
          Keep the app installed. Read the error message and retry loading your saved data before editing
          again. Check whether your change was recovered before repeating it, and check available device
          storage. Deleting the app to troubleshoot can remove your plans.
        </Body>
      </View>

      <View style={styles.section}>
        <H2 accessibilityRole="header">Removing your data</H2>
        <Body style={styles.paragraph}>
          Delete individual planning records in the app. There is currently no single in-app action
          to erase everything. On iOS, choose Delete App to remove the app and its local data;
          Offload App keeps its documents and data. Exported files, shared copies and device backups
          must be managed separately.
        </Body>
      </View>

      <View style={styles.section}>
        <H2 accessibilityRole="header">Support and privacy questions</H2>
        <Body style={styles.paragraph}>
          UltraEdge is operated by Beaux Walton. For private privacy, support or abuse concerns,
          contact hello@heybeaux.dev. The email link opens your email app; you review and send
          the message. It is not an emergency service.
        </Body>
        <Body style={styles.paragraph}>
          Visit the support page for contact options and troubleshooting. Include your app version,
          device model, iOS version and the steps that led to the problem. For collaboration abuse,
          open a shared race and use Report or Block under Team access.
        </Body>
        <Body style={styles.paragraph}>
          Do not post private routes, crew contact details, health information or screenshots
          containing them to a public issue tracker. Do not use team reports for emergencies.
        </Body>
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Open UltraEdge support"
          onPress={() => { void openLink(SUPPORT_URL,'support'); }}
          style={styles.link}
        >
          <Body style={{ color: theme.colors.forest, textDecorationLine: 'underline' }}>Support and contact options</Body>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Email Beaux Walton privately for privacy, support or abuse concerns at hello@heybeaux.dev"
          onPress={() => { void openPrivateEmail(); }}
          style={styles.link}
        >
          <Body style={{ color: theme.colors.forest, textDecorationLine: 'underline' }}>Email hello@heybeaux.dev privately</Body>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24 },
  section: { marginTop: 28 },
  paragraph: { marginTop: 12 },
  link: { paddingVertical: 16, minHeight: 48 },
});
