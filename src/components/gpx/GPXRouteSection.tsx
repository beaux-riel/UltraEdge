import { resolveLocalGpxUri } from '../../lib/localGpxUri';
/**
 * GPX route section for the event detail screen:
 * upload, preview, replace, and remove a course GPX file.
 *
 * V1 imports remain on this device. Legacy remote references can still be
 * read, but importing never uploads private course data automatically.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

import { useTheme } from '../../theme';
import { H2, BodySmall, Button, Card, CardContent } from '../ui';
import { isRemoteGpxPath, downloadGpx } from '../../lib/gpxStorage';
import { GpxRouteStats } from '../../lib/gpx';
import { importLocalGpx } from '../../lib/importGpx';
import GPXViewer from './GPXViewer';

interface GPXRouteSectionProps {
  eventId: string;
  gpxFileUrl: string | null;
  /**
   * Called when the stored route reference changes. `stats` is provided only
   * on a fresh import so the parent can populate the event's course figures;
   * it is undefined for storage-path promotions and removals.
   */
  onGpxChange: (fileUri: string | null, stats?: GpxRouteStats) => Promise<void>;
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
  const { width } = useWindowDimensions();
  const [busy, setBusy] = useState(false);
  const [contentWidth, setContentWidth] = useState<number | null>(null);
  const [resolvedUri, setResolvedUri] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setDownloadFailed(false);
    setDownloading(false);
    setResolvedUri(null);

    const resolve = async () => {
      if (!gpxFileUrl) {
        setResolvedUri(null);
        return;
      }

      if (!isRemoteGpxPath(gpxFileUrl)) {
        const local = new File(resolveLocalGpxUri(gpxFileUrl, Paths.document.uri));
        const exists = (() => {
          try {
            return local.exists;
          } catch {
            return false;
          }
        })();
        setResolvedUri(exists ? local.uri : null);

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

    resolve().catch(() => {
      if (!cancelled) {
        setResolvedUri(null);
        setDownloadFailed(true);
        setDownloading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // onGpxChange is an inline prop; re-running on its identity would loop the effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpxFileUrl, eventId, retryToken]);

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
      const uri = await importLocalGpx(asset.uri, eventId, onGpxChange);
      setResolvedUri(uri);
      // Prior files remain recoverable until explicit local-data cleanup.

    } catch (e) {
      Alert.alert('Import Failed', e instanceof Error ? e.message : 'Failed to import the GPX file. Your previous route is unchanged.');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = () => {
    Alert.alert('Remove Route?', 'Remove the route from this plan on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setBusy(true);
          try {
            // Clear the durable reference first. Existing files remain recoverable.
            await onGpxChange(null);
            setResolvedUri(null);
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
            width={contentWidth ?? width - spacing.lg * 2 - CARD_PADDING * 2}
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
            : 'No course route yet. Import a GPX file to see the course on a map with distance and elevation stats.'}
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
        <H2>The course</H2>
        {resolvedUri && (
          <Button variant="tertiary" size="sm" onPress={handlePick} disabled={busy}>
            Replace
          </Button>
        )}
      </View>
      <Card>
        <CardContent>
          <View onLayout={e => setContentWidth(e.nativeEvent.layout.width)}>{renderBody()}</View>
        </CardContent>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    marginBottom: 24,
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
