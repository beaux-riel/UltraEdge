/**
 * GPX route + elevation profile renderer (Skia)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import { File } from 'expo-file-system';
import { DOMParser } from '@xmldom/xmldom';

import { useTheme } from '../../theme';
import { BodySmall, Caption } from '../ui';

interface GPXPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface GPXStats {
  pointCount: number;
  minEle: number | null;
  maxEle: number | null;
}

interface GPXViewerProps {
  fileUri: string;
  width?: number;
  height?: number;
  onStats?: (stats: GPXStats) => void;
}

function parseGPXPoints(xml: string): GPXPoint[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  let nodes = doc.getElementsByTagName('trkpt');
  if (nodes.length === 0) nodes = doc.getElementsByTagName('rtept');

  const points: GPXPoint[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const lat = parseFloat(node.getAttribute('lat') || '');
    const lon = parseFloat(node.getAttribute('lon') || '');
    if (isNaN(lat) || isNaN(lon)) continue;

    let ele: number | undefined;
    const eleNodes = node.getElementsByTagName('ele');
    if (eleNodes.length > 0) {
      const parsed = parseFloat(eleNodes[0].textContent || '');
      if (!isNaN(parsed)) ele = parsed;
    }
    points.push({ lat, lon, ele });
  }
  return points;
}

export default function GPXViewer({
  fileUri,
  width = Dimensions.get('window').width - 64,
  height = 220,
  onStats,
}: GPXViewerProps) {
  const { theme } = useTheme();
  const { colors, spacing } = theme;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<GPXPoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const content = await new File(fileUri).text();
        const parsed = parseGPXPoints(content);
        if (parsed.length === 0) throw new Error('No track points found');
        if (!cancelled) setPoints(parsed);
      } catch (e) {
        if (!cancelled) setError('Could not read this GPX file.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [fileUri]);

  const { routePath, elevationPath, minEle, maxEle } = useMemo((): {
    routePath: SkPath | null;
    elevationPath: SkPath | null;
    minEle: number | null;
    maxEle: number | null;
  } => {
    if (points.length < 2) {
      return { routePath: null, elevationPath: null, minEle: null, maxEle: null };
    }

    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    let lo = Infinity, hi = -Infinity;
    for (const p of points) {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLon = Math.min(minLon, p.lon);
      maxLon = Math.max(maxLon, p.lon);
      if (p.ele !== undefined) {
        lo = Math.min(lo, p.ele);
        hi = Math.max(hi, p.ele);
      }
    }

    const hasEle = lo !== Infinity && hi > lo;
    const pad = 10;
    const mapH = hasEle ? height * 0.6 : height;
    const availW = width - pad * 2;
    const mapAvailH = mapH - pad * 2;
    const latRange = maxLat - minLat || 1e-9;
    const lonRange = maxLon - minLon || 1e-9;

    // Preserve aspect ratio so the route isn't distorted
    const scale = Math.min(availW / lonRange, mapAvailH / latRange);
    const offsetX = pad + (availW - lonRange * scale) / 2;
    const offsetY = pad + (mapAvailH - latRange * scale) / 2;

    const route = Skia.Path.Make();
    points.forEach((p, i) => {
      const x = offsetX + (p.lon - minLon) * scale;
      const y = offsetY + (maxLat - p.lat) * scale;
      if (i === 0) route.moveTo(x, y);
      else route.lineTo(x, y);
    });

    let elevation: SkPath | null = null;
    if (hasEle) {
      elevation = Skia.Path.Make();
      const eleTop = mapH + pad;
      const eleH = height - mapH - pad * 2;
      const eleRange = hi - lo;
      points.forEach((p, i) => {
        const x = pad + (i / (points.length - 1)) * availW;
        const y = eleTop + eleH - (((p.ele ?? lo) - lo) / eleRange) * eleH;
        if (i === 0) elevation!.moveTo(x, y);
        else elevation!.lineTo(x, y);
      });
    }

    return {
      routePath: route,
      elevationPath: elevation,
      minEle: hasEle ? lo : null,
      maxEle: hasEle ? hi : null,
    };
  }, [points, width, height]);

  useEffect(() => {
    if (points.length > 0 && onStats) {
      onStats({ pointCount: points.length, minEle, maxEle });
    }
  }, [points.length, minEle, maxEle, onStats]);

  if (loading) {
    return (
      <View style={[styles.center, { width, height }]}>
        <ActivityIndicator size="small" color={colors.forest} />
        <Caption style={{ marginTop: spacing.xs }}>Loading route…</Caption>
      </View>
    );
  }

  if (error || !routePath) {
    return (
      <View style={[styles.center, { width, height }]}>
        <BodySmall style={{ color: colors.clay }}>{error ?? 'No route data'}</BodySmall>
      </View>
    );
  }

  return (
    <View>
      <Canvas style={{ width, height }}>
        <Path path={routePath} color={colors.forest} style="stroke" strokeWidth={2.5} strokeJoin="round" strokeCap="round" />
        {elevationPath && (
          <Path path={elevationPath} color={colors.sky} style="stroke" strokeWidth={2} strokeJoin="round" strokeCap="round" />
        )}
      </Canvas>
      {minEle !== null && maxEle !== null && (
        <View style={styles.labels}>
          <Caption>Elevation {Math.round(minEle)}m – {Math.round(maxEle)}m</Caption>
          <Caption>{points.length.toLocaleString()} points</Caption>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
