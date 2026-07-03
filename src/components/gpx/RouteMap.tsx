/**
 * Route map — draws a GPX route as a Polyline over real map tiles with
 * start/finish markers and adjustable distance markers (mi or km, at a
 * configurable increment, or hidden entirely).
 *
 * Used in two modes:
 *  - preview (interactive=false): gestures disabled, parent handles taps
 *  - full screen (interactive=true): pinch/zoom/pan enabled
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme';
import { fonts } from '../../theme/typography';
import { RouteMetrics, RoutePoint, routeRegion, distanceMarkers } from '../../lib/gpx';
import type { DistanceUnit } from '../../lib/database.types';

export type RouteMapType = 'standard' | 'satellite' | 'hybrid';

const DEFAULT_MARKER_INTERVAL = 5;

interface RouteMapProps {
  metrics: RouteMetrics;
  height: number;
  interactive?: boolean;
  mapType?: RouteMapType;
  /** Position highlighted by the elevation-profile scrubber. */
  scrubPoint?: RoutePoint | null;
  /** Distance-marker display unit. Default miles. */
  markerUnit?: DistanceUnit;
  /** Marker spacing in display units (1 / 5 / 10). Default 5. */
  markerInterval?: number;
  /** Show/hide the distance markers. Default true. */
  showMarkers?: boolean;
  style?: ViewStyle;
}

export default function RouteMap({
  metrics,
  height,
  interactive = false,
  mapType = 'standard',
  scrubPoint = null,
  markerUnit = 'miles',
  markerInterval = DEFAULT_MARKER_INTERVAL,
  showMarkers = true,
  style,
}: RouteMapProps) {
  const { theme } = useTheme();
  const { colors, radius } = theme;

  const region = useMemo(() => routeRegion(metrics.bounds), [metrics]);
  const coordinates = useMemo(
    () => metrics.points.map(p => ({ latitude: p.lat, longitude: p.lon })),
    [metrics]
  );
  // Distance-marker "slots": one mounted <Marker> per whole display unit,
  // buffered to the larger of the mi/km counts. Interval, unit, and Off
  // changes only toggle opacity / update content — Marker children are never
  // unmounted, because removing Marker children crashes react-native-maps
  // 1.20.x on iOS under the new architecture (react-native-maps#5214).
  const markerSlots = useMemo(() => {
    const mi = distanceMarkers(metrics.points, 1, 'miles');
    const km = distanceMarkers(metrics.points, 1, 'kilometers');
    const active = markerUnit === 'kilometers' ? km : mi;
    const count = Math.max(mi.length, km.length);
    const park = metrics.points[0];
    return Array.from({ length: count }, (_, i) =>
      i < active.length
        ? { value: active[i].value, lat: active[i].lat, lon: active[i].lon, parked: false }
        : { value: 0, lat: park.lat, lon: park.lon, parked: true }
    );
  }, [metrics, markerUnit]);

  const start = metrics.points[0];
  const finish = metrics.points[metrics.points.length - 1];

  // Route line: sunrise orange reads well on both light/dark tiles and satellite.
  const routeColor = colors.sunrise;

  return (
    <View
      style={[
        { height, borderRadius: interactive ? 0 : radius.md, overflow: 'hidden' },
        style,
      ]}
      pointerEvents={interactive ? 'auto' : 'none'}
    >
      <MapView
        style={StyleSheet.absoluteFill}
        mapType={mapType}
        userInterfaceStyle={theme.mode}
        initialRegion={region}
        region={interactive ? undefined : region}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        toolbarEnabled={false}
        showsCompass={interactive}
        showsScale={interactive}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor={routeColor}
          strokeWidth={3}
          lineJoin="round"
          lineCap="round"
        />

        {/* Distance markers first so start/finish render on top */}
        {markerSlots.map((slot, i) => (
          <DistanceMarkerSlot
            key={`marker-slot-${i}`}
            latitude={slot.lat}
            longitude={slot.lon}
            label={slot.parked ? '' : String(slot.value)}
            visible={
              showMarkers && !slot.parked && slot.value % markerInterval === 0
            }
            surfaceColor={colors.surface}
            borderColor={colors.trail}
            textColor={colors.bark}
          />
        ))}

        <Marker
          coordinate={{ latitude: start.lat, longitude: start.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          title={interactive ? 'Start' : undefined}
        >
          <View style={[styles.endpointMarker, { backgroundColor: colors.meadow }]}>
            <Ionicons name="play" size={10} color="#FFFFFF" />
          </View>
        </Marker>

        <Marker
          coordinate={{ latitude: finish.lat, longitude: finish.lon }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          title={interactive ? 'Finish' : undefined}
        >
          <View style={[styles.endpointMarker, { backgroundColor: colors.clay }]}>
            <CheckeredFlag />
          </View>
        </Marker>

        {/* Always mounted (hidden via opacity) — unmounting Marker children
            crashes react-native-maps 1.20.x on iOS under the new arch. */}
        <Marker
          coordinate={{
            latitude: (scrubPoint ?? start).lat,
            longitude: (scrubPoint ?? start).lon,
          }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          opacity={scrubPoint ? 1 : 0}
        >
          <View style={[styles.scrubMarker, { backgroundColor: colors.sky }]} />
        </Marker>
      </MapView>
    </View>
  );
}

/** How long a marker keeps tracking view changes after its content updates. */
const MARKER_SNAPSHOT_MS = 500;

/**
 * One persistent distance-marker slot. Mounts with tracksViewChanges enabled
 * so react-native-maps snapshots the badge after it has actually laid out
 * (snapshotting immediately with tracksViewChanges={false} captures a blank
 * view), then disables tracking to avoid re-render churn while panning.
 * Re-enables tracking briefly whenever the label or theme colors change.
 */
function DistanceMarkerSlot({
  latitude,
  longitude,
  label,
  visible,
  surfaceColor,
  borderColor,
  textColor,
}: {
  latitude: number;
  longitude: number;
  label: string;
  visible: boolean;
  surfaceColor: string;
  borderColor: string;
  textColor: string;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), MARKER_SNAPSHOT_MS);
    return () => clearTimeout(timer);
  }, [label, surfaceColor, borderColor, textColor]);

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={tracksViewChanges}
      opacity={visible ? 1 : 0}
    >
      <View style={[styles.mileMarker, { backgroundColor: surfaceColor, borderColor }]}>
        <Text style={[styles.mileMarkerText, { color: textColor }]}>{label}</Text>
      </View>
    </Marker>
  );
}

/** Tiny 2x2 checkerboard used inside the finish marker. */
function CheckeredFlag() {
  return (
    <View style={styles.checkerGrid}>
      <View style={styles.checkerRow}>
        <View style={[styles.checkerCell, styles.checkerDark]} />
        <View style={[styles.checkerCell, styles.checkerLight]} />
      </View>
      <View style={styles.checkerRow}>
        <View style={[styles.checkerCell, styles.checkerLight]} />
        <View style={[styles.checkerCell, styles.checkerDark]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mileMarker: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 4,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mileMarkerText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fonts.primary.bold,
  },
  endpointMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrubMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  checkerGrid: {
    width: 12,
    height: 12,
    borderRadius: 2,
    overflow: 'hidden',
  },
  checkerRow: {
    flexDirection: 'row',
    flex: 1,
  },
  checkerCell: {
    flex: 1,
  },
  checkerDark: {
    backgroundColor: '#1A1714',
  },
  checkerLight: {
    backgroundColor: '#FFFFFF',
  },
});
