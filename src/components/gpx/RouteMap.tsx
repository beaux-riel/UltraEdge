/**
 * Route map — draws a GPX route as a Polyline over real map tiles with
 * start/finish markers and small mile markers every 5 miles.
 *
 * Used in two modes:
 *  - preview (interactive=false): gestures disabled, parent handles taps
 *  - full screen (interactive=true): pinch/zoom/pan enabled
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../theme';
import { fonts } from '../../theme/typography';
import { RouteMetrics, RoutePoint, routeRegion, mileMarkers } from '../../lib/gpx';

export type RouteMapType = 'standard' | 'satellite' | 'hybrid';

const MILE_MARKER_INTERVAL = 5;

interface RouteMapProps {
  metrics: RouteMetrics;
  height: number;
  interactive?: boolean;
  mapType?: RouteMapType;
  /** Position highlighted by the elevation-profile scrubber. */
  scrubPoint?: RoutePoint | null;
  style?: ViewStyle;
}

export default function RouteMap({
  metrics,
  height,
  interactive = false,
  mapType = 'standard',
  scrubPoint = null,
  style,
}: RouteMapProps) {
  const { theme } = useTheme();
  const { colors, radius } = theme;

  const region = useMemo(() => routeRegion(metrics.bounds), [metrics]);
  const coordinates = useMemo(
    () => metrics.points.map(p => ({ latitude: p.lat, longitude: p.lon })),
    [metrics]
  );
  const markers = useMemo(
    () => mileMarkers(metrics.points, MILE_MARKER_INTERVAL),
    [metrics]
  );

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

        {/* Mile markers first so start/finish render on top */}
        {markers.map(m => (
          <Marker
            key={`mile-${m.mile}`}
            coordinate={{ latitude: m.lat, longitude: m.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View
              style={[
                styles.mileMarker,
                { backgroundColor: colors.surface, borderColor: colors.trail },
              ]}
            >
              <Text style={[styles.mileMarkerText, { color: colors.bark }]}>{m.mile}</Text>
            </View>
          </Marker>
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

        {scrubPoint && (
          <Marker
            coordinate={{ latitude: scrubPoint.lat, longitude: scrubPoint.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={[styles.scrubMarker, { backgroundColor: colors.sky }]} />
          </Marker>
        )}
      </MapView>
    </View>
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
