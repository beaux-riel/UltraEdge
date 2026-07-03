/**
 * GPX course viewer.
 *
 * Embedded preview (event detail screen):
 *  - real map tiles with the route as a polyline, start/finish markers
 *  - measurement stats: distance, elevation gain/loss, min/max elevation
 *  - elevation profile with labeled distance/elevation axes
 *
 * Tapping the map preview opens a full-screen modal with an interactive
 * map (pinch/zoom/pan), a standard/hybrid map-type toggle, a scrubbable
 * elevation profile that highlights the matching spot on the map, and
 * distance-marker controls (off / 1 / 5 / 10 unit spacing).
 *
 * All displayed figures follow a viewer-level distance unit (mi ↔ km with
 * paired ft ↔ m elevation). The unit defaults to the mover's profile
 * preference and can be toggled inline in both the preview and the modal.
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
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../theme';
import { useMover } from '../../context/MoverContext';
import { Text, H3, BodySmall, Caption } from '../ui';
import {
  RouteMetrics,
  parseGpx,
  computeRouteMetrics,
  pointAtDistance,
  formatMiles,
  formatFeet,
  milesToUnit,
  feetToUnit,
  distanceUnitLabel,
  elevationUnitLabel,
  elevationUnitForDistance,
} from '../../lib/gpx';
import type { DistanceUnit } from '../../lib/database.types';
import RouteMap, { RouteMapType } from './RouteMap';
import ElevationProfile from './ElevationProfile';

const PREVIEW_MAP_HEIGHT = 200;
const PREVIEW_PROFILE_HEIGHT = 130;
const FULLSCREEN_PROFILE_HEIGHT = 150;
const DEFAULT_MARKER_INTERVAL = 5;

/** Marker spacing choices, in display units. 0 = markers hidden. */
const MARKER_INTERVAL_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Off' },
  { value: 1, label: '1' },
  { value: 5, label: '5' },
  { value: 10, label: '10' },
];

const UNIT_OPTIONS: { value: DistanceUnit; label: string }[] = [
  { value: 'miles', label: 'mi' },
  { value: 'kilometers', label: 'km' },
];

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
  const { profile } = useMover();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<RouteMetrics | null>(null);

  const [fullScreen, setFullScreen] = useState(false);
  const [mapType, setMapType] = useState<RouteMapType>('standard');
  const [scrubDistanceMi, setScrubDistanceMi] = useState<number | null>(null);

  // Display unit: follow the profile preference until the user overrides it.
  const [unitOverride, setUnitOverride] = useState<DistanceUnit | null>(null);
  const distanceUnit = unitOverride ?? profile.distance_unit;
  const [markerInterval, setMarkerInterval] = useState(DEFAULT_MARKER_INTERVAL);

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

  const elevationUnit = elevationUnitForDistance(distanceUnit);
  const distLabel = distanceUnitLabel(distanceUnit);
  const eleLabel = elevationUnitLabel(elevationUnit);
  const showMarkers = markerInterval > 0;

  return (
    <View style={{ width }}>
      {/* Map preview — tap to open the full-screen interactive view */}
      <Pressable
        onPress={() => setFullScreen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open full-screen course map"
      >
        <RouteMap
          metrics={metrics}
          height={PREVIEW_MAP_HEIGHT}
          markerUnit={distanceUnit}
          markerInterval={showMarkers ? markerInterval : DEFAULT_MARKER_INTERVAL}
          showMarkers={showMarkers}
        />
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

      <View style={[styles.controlsRow, { marginTop: spacing.sm }]}>
        <StatsRow metrics={metrics} distanceUnit={distanceUnit} style={styles.statsFlex} />
        <Segmented
          options={UNIT_OPTIONS}
          value={distanceUnit}
          onChange={setUnitOverride}
          accessibilityLabel="Distance unit"
        />
      </View>

      {metrics.hasElevation && (
        <ElevationProfile
          metrics={metrics}
          width={width}
          height={PREVIEW_PROFILE_HEIGHT}
          distanceUnit={distanceUnit}
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
        {/*
          RN Modals mount in their own native window, so the app-root
          SafeAreaProvider's insets don't reach this subtree (they read as 0,
          putting the header under the iOS status bar and clipping the chart
          behind the home indicator). Mount a fresh provider inside the Modal
          so SafeAreaView measures real insets for this window.
        */}
        <SafeAreaProvider>
          <SafeAreaView
            edges={['top', 'bottom', 'left', 'right']}
            style={{ flex: 1, backgroundColor: colors.parchment }}
          >
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
              <Segmented
                options={MAP_TYPE_OPTIONS}
                value={mapType}
                onChange={setMapType}
                accessibilityLabel="Map type"
              />
            </View>

            {/* Viewer settings: display unit + distance-marker spacing */}
            <View style={styles.modalControls}>
              <View style={styles.controlGroup}>
                <Caption style={{ marginRight: 6 }}>Units</Caption>
                <Segmented
                  options={UNIT_OPTIONS}
                  value={distanceUnit}
                  onChange={setUnitOverride}
                  accessibilityLabel="Distance unit"
                />
              </View>
              <View style={styles.controlGroup}>
                <Caption style={{ marginRight: 6 }}>Markers ({distLabel})</Caption>
                <Segmented
                  options={MARKER_INTERVAL_OPTIONS}
                  value={markerInterval}
                  onChange={setMarkerInterval}
                  accessibilityLabel="Distance marker spacing"
                />
              </View>
            </View>

            <RouteMap
              metrics={metrics}
              height={0}
              interactive
              mapType={mapType}
              scrubPoint={scrubPoint}
              markerUnit={distanceUnit}
              markerInterval={showMarkers ? markerInterval : DEFAULT_MARKER_INTERVAL}
              showMarkers={showMarkers}
              style={styles.modalMap}
            />

            <View style={{ padding: spacing.md }}>
              <StatsRow metrics={metrics} distanceUnit={distanceUnit} />
              {metrics.hasElevation && (
                <>
                  <View style={styles.scrubInfo}>
                    {scrubPoint ? (
                      <Caption style={{ color: colors.sky }}>
                        {formatMiles(milesToUnit(scrubPoint.distanceMi, distanceUnit))} {distLabel}
                        {scrubPoint.eleFt !== null
                          ? ` · ${formatFeet(feetToUnit(scrubPoint.eleFt, elevationUnit))} ${eleLabel}`
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
                    distanceUnit={distanceUnit}
                    onScrub={setScrubDistanceMi}
                    scrubDistanceMi={scrubDistanceMi}
                  />
                </>
              )}
            </View>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
}

// ============================================================================
// STATS
// ============================================================================

interface StatsRowProps {
  metrics: RouteMetrics;
  distanceUnit: DistanceUnit;
  style?: object;
}

function StatsRow({ metrics, distanceUnit, style }: StatsRowProps) {
  const elevationUnit = elevationUnitForDistance(distanceUnit);
  const distLabel = distanceUnitLabel(distanceUnit);
  const eleLabel = elevationUnitLabel(elevationUnit);
  const dist = (mi: number) => formatMiles(milesToUnit(mi, distanceUnit));
  const ele = (ft: number) => formatFeet(feetToUnit(ft, elevationUnit));

  const stats: { label: string; value: string; unit: string }[] = [
    { label: 'Distance', value: dist(metrics.totalDistanceMi), unit: distLabel },
  ];
  if (metrics.hasElevation) {
    if (metrics.elevationGainFt !== null) {
      stats.push({ label: 'Gain', value: `+${ele(metrics.elevationGainFt)}`, unit: eleLabel });
    }
    if (metrics.elevationLossFt !== null) {
      stats.push({ label: 'Loss', value: `-${ele(metrics.elevationLossFt)}`, unit: eleLabel });
    }
    if (metrics.minElevationFt !== null) {
      stats.push({ label: 'Min Elev', value: ele(metrics.minElevationFt), unit: eleLabel });
    }
    if (metrics.maxElevationFt !== null) {
      stats.push({ label: 'Max Elev', value: ele(metrics.maxElevationFt), unit: eleLabel });
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
// SEGMENTED CONTROL
// ============================================================================

const MAP_TYPE_OPTIONS: { value: RouteMapType; label: string }[] = [
  { value: 'standard', label: 'Map' },
  { value: 'hybrid', label: 'Hybrid' },
];

interface SegmentedProps<T> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedProps<T>) {
  const { theme } = useTheme();
  const { colors, radius } = theme;

  return (
    <View
      style={[styles.toggle, { backgroundColor: colors.birch, borderRadius: radius.sm }]}
      accessibilityLabel={accessibilityLabel}
    >
      {options.map(option => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={String(option.value)}
            onPress={() => onChange(option.value)}
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statsFlex: {
    flex: 1,
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
  modalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  controlGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
