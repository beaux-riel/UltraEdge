/** Offline-readable information for the free local V1 release. */
import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { H2, Body, BodySmall } from '../../components/ui';

const SUPPORT_URL = 'https://github.com/beaux-riel/UltraEdge/issues';

export default function PrivacySupportScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const openSupport = async () => {
    try { await Linking.openURL(SUPPORT_URL); }
    catch {
      Alert.alert('Could not open support', 'Connect to the internet and try again, or visit github.com/beaux-riel/UltraEdge/issues in your browser.');
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.parchment }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
    >
      <BodySmall>UltraEdge 1.0 · Updated September 6, 2026</BodySmall>
      <Body style={styles.paragraph}>This information is available offline. Opening the support link requires an internet connection.</Body>

      <View style={styles.section}>
        <H2 accessibilityRole="header">Local plans and optional team sharing</H2>
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
        <H2 accessibilityRole="header">Live team races</H2>
        <Body style={styles.paragraph}>
          Creating or joining a team race connects to Supabase in Canada and creates a guest identity
          whose session is stored securely on this phone. Shared race timing, checkpoint names,
          stop plans, crew display names, vehicle and cargo labels, and time observations are stored
          on the server and cached on joined phones. Crew phone numbers, emails, personal notes
          and route files are excluded from this upload. The service also processes connection
          information such as IP addresses for authentication and abuse prevention.
        </Body>
        <Body style={styles.paragraph}>
          Sharing is optional. Team members can read the plan and submit their own observations.
          The owner can remove members or stop sharing and delete the room. In Events, open the
          live team panel and choose Delete my collaboration data to delete your guest identity,
          owned rooms and reports. Removing a local race or deleting the app does not delete
          server copies. Previously downloaded or exported copies held by others remain with them.
          Pending reports stay on the device until synchronized. A new phone needs a new invitation;
          guest owner access has no email or password recovery.
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
          Report problems through the UltraEdge GitHub issue tracker. Include your app version,
          device model, iOS version and the steps that led to the problem. GitHub may require an account
          to post and handles posts under its own privacy practices.
        </Body>
        <Body style={styles.paragraph}>
          Issues are public. Do not post private routes, crew contact details, health information or
          screenshots containing them. For a sensitive concern, first request a private contact method
          without including sensitive details.
        </Body>
        <TouchableOpacity
          accessibilityRole="link"
          accessibilityLabel="Open UltraEdge support on GitHub, public issue tracker"
          onPress={() => { void openSupport(); }}
          style={styles.link}
        >
          <Body style={{ color: theme.colors.forest, textDecorationLine: 'underline' }}>Open public GitHub issue tracker</Body>
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
