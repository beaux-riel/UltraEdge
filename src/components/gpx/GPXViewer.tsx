/**
 * GPX course viewer.
 *
 * Embedded preview (event detail screen):
 *  - real map tiles with the route as a polyline, start/finish markers
 *  - measurement stats: distance, elevation gain/loss, min/max elevation
 *  - elevation profile with labeled distance/elevation axes
 *
 * Tapping the map preview opens a full-screen modal with an interactive
 * map (pinch/zoom/pan), a standard/hybrid map-type toggle, and a
 * scrubbable elevation profile that highlights the matching spot on the
 * map. The modal lives inside this component tree — no navigator changes.
 *
 * Units follow the codebase convention in src/lib/gpx.ts: miles + feet.
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { File } from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { Text, H3, BodySmall, Caption } from '../ui';
import {
  RouteMetrics,
  parseGpx,
  computeRouteMetrics,
  pointAtDistance,
  formatMiles,
  formatFeet,
} from '../../lib/gpx';
import RouteMap, { RouteMapType } from './RouteMap';
import ElevationProfile from './ElevationProfile';

const PREVIEW_MAP_HEIGHT = 200;
const PREVIEW_PROFILE_HEIGHT = 130;
const FULLSCREEN_PROFILE_HEIGHT = 150;

interface GPXViewerProps {
  fileUri: string;
  /** Available width for the embedded preview (map, stats, chart). */
  width?: number;
}

export default function GPXViewer({
  fileUri,
  width = Dimensions.get('window').width - 64,
}: GPXViewerProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;
  const { width: windowWidth } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RouteMetrics | null>(null);

  const [fullScreen, setFullScreen] = useState(false);
  const [mapType, setMapType] = useState<RouteMapType>('standard');
  const [scrubDistanceMi, setScrubDistanceMi] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const content = await new File(fileUri).text();
        const computed = computeRouteMetrics(parseGpx(content));
        if (!computed) throw new Error('No track points found');
        if (!cancelled) setMetrics(computed);
      } catch {
        if (!cancelled) {
          setMetrics(null);
          setError('Could not read this GPX file.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fileUri]);

  const scrubPoint = useMemo(() => {
    if (!metrics || scrubDistanceMi === null) return null;
    return pointAtDistance(metrics.points, scrubDistanceMi);
  }, [metrics, scrubDistanceMi]);

  const closeFullScreen = () => {
    setFullScreen(false);
    setScrubDistanceMi(null);
  };

  if (loading) {
    return (
      <View style={[styles.center, { width, height: PREVIEW_MAP_HEIGHT }]}>
        <ActivityIndicator size="small" color={colors.forest} />
        <Caption style={{ marginTop: spacing.xs }}>Loading route…</Caption>
      </View>
    );
  }

  if (error || !metrics) {
    return (
      <View style={[styles.center, { width, height: PREVIEW_MAP_HEIGHT }]}>
        <BodySmall style={{ color: colors.clay }}>{error ?? 'No route data'}</BodySmall>
      </View>
    );
  }

  return (
    <View style={{ width }}>
      {/* Map preview — tap to open the full-screen interactive view */}
      <Pressable
        onPress={() => setFullScreen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open full-screen course map"
      >
        <RouteMap metrics={metrics} height={PREVIEW_MAP_HEIGHT} />
        <View
          style={[
            styles.expandBadge,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="expand-outline" size={13} color={colors.stone} />
          <Caption style={{ marginLeft: 4, color: colors.stone }}>Tap to explore</Caption>
        </View>
      </Pressable>

      <StatsRow metrics={metrics} style={{ marginTop: spacing.sm }} />

      {metrics.hasElevation && (
        <ElevationProfile
          metrics={metrics}
          width={width}
          height={PREVIEW_PROFILE_HEIGHT}
          style={{ marginTop: spacing.sm }}
        />
      )}

      {/* Full-screen interactive viewer */}
      <Modal
        visible={fullScreen}
        animationType="slide"
        onRequestClose={closeFullScreen}
        statusBarTranslucent
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.parchment }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={closeFullScreen}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close course map"
            >
              <Ionicons name="close" size={26} color={colors.bark} />
            </TouchableOpacity>
            <H3>Course Route</H3>
            <MapTypeToggle value={mapType} onChange={setMapType} />
          </View>

          <RouteMap
            metrics={metrics}
            height={0}
            interactive
            mapType={mapType}
            scrubPoint={scrubPoint}
            style={styles.modalMap}
          />

          <View style={{ padding: spacing.md }}>
            <StatsRow metrics={metrics} />
            {metrics.hasElevation && (
              <>
                <View style={styles.scrubInfo}>
                  {scrubPoint ? (
                    <Caption style={{ color: colors.sky }}>
                      {formatMiles(scrubPoint.distanceMi)} mi
                      {scrubPoint.eleFt !== null
                        ? ` · ${formatFeet(scrubPoint.eleFt)} ft`
                        : ''}
                    </Caption>
                  ) : (
                    <Caption>Drag across the profile to explore the course</Caption>
                  )}
                </View>
                <ElevationProfile
                  metrics={metrics}
                  width={windowWidth - spacing.md * 2}
                  height={FULLSCREEN_PROFILE_HEIGHT}
                  onScrub={setScrubDistanceMi}
                  scrubDistanceMi={scrubDistanceMi}
                />
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ============================================================================
// STATS
// ============================================================================

interface StatsRowProps {
  metrics: RouteMetrics;
  style?: object;
}

function StatsRow({ metrics, style }: StatsRowProps) {
  const stats: { label: string; value: string; unit: string }[] = [
    { label: 'Distance', value: formatMiles(metrics.totalDistanceMi), unit: 'mi' },
  ];
  if (metrics.hasElevation) {
    if (metrics.elevationGainFt !== null) {
      stats.push({ label: 'Gain', value: `+${formatFeet(metrics.elevationGainFt)}`, unit: 'ft' });
    }
    if (metrics.elevationLossFt !== null) {
      stats.push({ label: 'Loss', value: `-${formatFeet(metrics.elevationLossFt)}`, unit: 'ft' });
    }
    if (metrics.minElevationFt !== null) {
      stats.push({ label: 'Min Elev', value: formatFeet(metrics.minElevationFt), unit: 'ft' });
    }
    if (metrics.maxElevationFt !== null) {
      stats.push({ label: 'Max Elev', value: formatFeet(metrics.maxElevationFt), unit: 'ft' });
    }
  }

  return (
    <View style={[styles.statsRow, style]}>
      {stats.map(s => (
        <View key={s.label} style={styles.statCell}>
          <View style={styles.statValueRow}>
            <Text variant="bodySmall" style={styles.statValue}>
              {s.value}
            </Text>
            <Caption style={{ marginLeft: 2 }}>{s.unit}</Caption>
          </View>
          <Caption>{s.label}</Caption>
        </View>
      ))}
    </View>
  );
}

// ============================================================================
// MAP TYPE TOGGLE
// ============================================================================

interface MapTypeToggleProps {
  value: RouteMapType;
  onChange: (type: RouteMapType) => void;
}

const MAP_TYPE_OPTIONS: { type: RouteMapType; label: string }[] = [
  { type: 'standard', label: 'Map' },
  { type: 'hybrid', label: 'Hybrid' },
];

function MapTypeToggle({ value, onChange }: MapTypeToggleProps) {
  const { theme } = useTheme();
  const { colors, radius } = theme;

  return (
    <View style={[styles.toggle, { backgroundColor: colors.birch, borderRadius: radius.sm }]}>
      {MAP_TYPE_OPTIONS.map(option => {
        const selected = option.type === value;
        return (
          <TouchableOpacity
            key={option.type}
            onPress={() => onChange(option.type)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[
              styles.toggleButton,
              {
                borderRadius: radius.sm - 2,
                backgroundColor: selected ? colors.forest : 'transparent',
              },
            ]}
          >
            <Caption style={{ color: selected ? colors.snow : colors.stone }}>
              {option.label}
            </Caption>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCell: {
    width: '33.33%',
    paddingVertical: 4,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontWeight: '700',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalMap: {
    flex: 1,
  },
  scrubInfo: {
    marginTop: 4,
    marginBottom: 4,
    minHeight: 18,
    justifyContent: 'center',
  },
  toggle: {
    flexDirection: 'row',
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
});
