/**
 * GPX route section for the event detail screen:
 * upload, preview, replace, and remove a course GPX file.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

import { useTheme } from '../../theme';
import { H2, BodySmall, Button, Card, CardContent } from '../ui';
import GPXViewer from './GPXViewer';

interface GPXRouteSectionProps {
  eventId: string;
  gpxFileUrl: string | null;
  onGpxChange: (fileUri: string | null) => Promise<void>;
}

const CARD_PADDING = 16;

export default function GPXRouteSection({ eventId, gpxFileUrl, onGpxChange }: GPXRouteSectionProps) {
  const { theme } = useTheme();
  const { spacing } = theme;
  const [busy, setBusy] = useState(false);

  const gpxDir = () => {
    const dir = new Directory(Paths.document, 'gpx');
    dir.create({ intermediates: true, idempotent: true });
    return dir;
  };

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // GPX mime types are inconsistent across providers; validate extension below
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset.name.toLowerCase().endsWith('.gpx')) {
        Alert.alert('Invalid File', 'Please select a GPX file (.gpx extension).');
        return;
      }

      setBusy(true);
      const dest = new File(gpxDir(), `${eventId}.gpx`);
      if (dest.exists) dest.delete();
      new File(asset.uri).copy(dest);
      await onGpxChange(dest.uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to import the GPX file. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Route?', 'The GPX file will be removed from this event.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            if (gpxFileUrl) {
              const file = new File(gpxFileUrl);
              if (file.exists) file.delete();
            }
            await onGpxChange(null);
          } catch (e) {
            Alert.alert('Error', 'Failed to remove the route.');
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  const localFileExists = (() => {
    if (!gpxFileUrl || !gpxFileUrl.startsWith('file:')) return false;
    try {
      return new File(gpxFileUrl).exists;
    } catch {
      return false;
    }
  })();

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <H2>Route</H2>
        {localFileExists && (
          <Button variant="tertiary" size="sm" onPress={handlePick} disabled={busy}>
            Replace
          </Button>
        )}
      </View>
      <Card>
        <CardContent>
          {localFileExists && gpxFileUrl ? (
            <>
              <GPXViewer
                fileUri={gpxFileUrl}
                width={Dimensions.get('window').width - spacing.lg * 2 - CARD_PADDING * 2}
              />
              <Button
                variant="secondary"
                size="sm"
                onPress={handleRemove}
                disabled={busy}
                style={{ marginTop: spacing.sm }}
              >
                Remove Route
              </Button>
            </>
          ) : (
            <View style={styles.empty}>
              <BodySmall color="tertiary" align="center">
                {gpxFileUrl
                  ? 'The GPX file for this event is not on this device.'
                  : 'No course route yet. Import a GPX file to preview the route and elevation profile.'}
              </BodySmall>
              <Button onPress={handlePick} disabled={busy} style={{ marginTop: spacing.md }}>
                {busy ? 'Importing…' : 'Add GPX Route'}
              </Button>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
