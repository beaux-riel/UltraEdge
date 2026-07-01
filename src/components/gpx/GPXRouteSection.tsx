/**
 * GPX route section for the event detail screen:
 * upload, preview, replace, and remove a course GPX file.
 *
 * Signed-in users get cloud sync: files upload to Supabase Storage and
 * `gpx_file_url` holds the storage path, so routes follow the account across
 * devices. Signed-out (or offline) imports fall back to a device-local
 * `file:` URI, and are opportunistically uploaded once the user is signed in.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

import { useTheme } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { H2, BodySmall, Button, Card, CardContent } from '../ui';
import { isRemoteGpxPath, uploadGpx, downloadGpx, removeGpx } from '../../lib/gpxStorage';
import GPXViewer from './GPXViewer';

interface GPXRouteSectionProps {
  eventId: string;
  gpxFileUrl: string | null;
  onGpxChange: (fileUri: string | null) => Promise<void>;
}

const CARD_PADDING = 16;

const gpxDir = () => {
  const dir = new Directory(Paths.document, 'gpx');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
};

const cachedGpxFile = (eventId: string) => new File(gpxDir(), `${eventId}.gpx`);

export default function GPXRouteSection({ eventId, gpxFileUrl, onGpxChange }: GPXRouteSectionProps) {
  const { theme } = useTheme();
  const { spacing } = theme;
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDownloadFailed(false);

    const resolve = async () => {
      if (!gpxFileUrl) {
        setResolvedUri(null);
        return;
      }

      if (!isRemoteGpxPath(gpxFileUrl)) {
        const local = new File(gpxFileUrl);
        const exists = (() => {
          try {
            return local.exists;
          } catch {
            return false;
          }
        })();
        setResolvedUri(exists ? gpxFileUrl : null);

        // Legacy device-local route + signed-in user: promote it to cloud
        // storage so it syncs. Failures are silent; the local copy still works.
        if (exists && user) {
          try {
            const path = await uploadGpx(user.id, eventId, local);
            if (!cancelled) await onGpxChange(path);
          } catch {
            // offline or storage unavailable — retry next time
          }
        }
        return;
      }

      const cached = cachedGpxFile(eventId);
      if (cached.exists) {
        setResolvedUri(cached.uri);
        return;
      }

      setDownloading(true);
      try {
        const uri = await downloadGpx(gpxFileUrl, cached);
        if (!cancelled) setResolvedUri(uri);
      } catch {
        if (!cancelled) {
          setResolvedUri(null);
          setDownloadFailed(true);
        }
      } finally {
        if (!cancelled) setDownloading(false);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
    // onGpxChange is an inline prop; re-running on its identity would loop the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpxFileUrl, eventId, user?.id, retryToken]);

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
      const dest = cachedGpxFile(eventId);
      if (dest.exists) dest.delete();
      new File(asset.uri).copy(dest);
      setResolvedUri(dest.uri);

      if (user) {
        try {
          const path = await uploadGpx(user.id, eventId, dest);
          await onGpxChange(path);
          return;
        } catch {
          Alert.alert(
            'Saved On This Device',
            'The route was imported but could not be uploaded to your account yet. It will sync automatically later.'
          );
        }
      }
      await onGpxChange(dest.uri);
    } catch (e) {
      Alert.alert('Error', 'Failed to import the GPX file. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Route?', 'The GPX file will be removed from this event on all devices.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            if (isRemoteGpxPath(gpxFileUrl)) {
              try {
                await removeGpx(gpxFileUrl);
              } catch {
                // storage cleanup is best-effort; the event reference is the
                // source of truth and is cleared below
              }
            }
            const cached = cachedGpxFile(eventId);
            if (cached.exists) cached.delete();
            if (gpxFileUrl && !isRemoteGpxPath(gpxFileUrl)) {
              const legacy = new File(gpxFileUrl);
              if (legacy.exists) legacy.delete();
            }
            setResolvedUri(null);
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

  const renderBody = () => {
    if (resolvedUri) {
      return (
        <>
          <GPXViewer
            fileUri={resolvedUri}
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
      );
    }

    if (downloading) {
      return (
        <View style={styles.empty}>
          <BodySmall color="tertiary" align="center">
            Downloading route…
          </BodySmall>
        </View>
      );
    }

    if (downloadFailed) {
      return (
        <View style={styles.empty}>
          <BodySmall color="tertiary" align="center">
            The route couldn’t be downloaded. Check your connection and try again.
          </BodySmall>
          <Button
            onPress={() => setRetryToken(t => t + 1)}
            disabled={busy}
            style={{ marginTop: spacing.md }}
          >
            Retry Download
          </Button>
          <Button
            variant="tertiary"
            size="sm"
            onPress={handleRemove}
            disabled={busy}
            style={{ marginTop: spacing.sm }}
          >
            Remove Route
          </Button>
        </View>
      );
    }

    return (
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
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <H2>Route</H2>
        {resolvedUri && (
          <Button variant="tertiary" size="sm" onPress={handlePick} disabled={busy}>
            Replace
          </Button>
        )}
      </View>
      <Card>
        <CardContent>{renderBody()}</CardContent>
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
