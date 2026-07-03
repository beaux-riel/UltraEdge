/**
 * Pure GPX parsing + route-metric helpers.
 *
 * All distances are in miles and all elevations in feet unless a name says
 * otherwise. Keeping this module free of React Native imports makes it
 * directly unit-testable under Jest's node environment.
 */

import { DOMParser } from '@xmldom/xmldom';

// ============================================================================
// TYPES
// ============================================================================

export interface GpxPoint {
  lat: number;
  lon: number;
  /** Raw GPX elevation, meters. */
  ele?: number;
}

export interface RoutePoint {
  lat: number;
  lon: number;
  /** Elevation in feet, or null when the source point had none. */
  eleFt: number | null;
  /** Cumulative distance from the start, miles. */
  distanceMi: number;
}

export interface RouteBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface RouteRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MileMarker {
  mile: number;
  lat: number;
  lon: number;
}

export interface ElevationSample {
  distanceMi: number;
  eleFt: number;
}

export interface RouteMetrics {
  points: RoutePoint[];
  bounds: RouteBounds;
  totalDistanceMi: number;
  hasElevation: boolean;
  elevationGainFt: number | null;
  elevationLossFt: number | null;
  minElevationFt: number | null;
  maxElevationFt: number | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const FEET_PER_METER = 3.28084;
const EARTH_RADIUS_MILES = 3958.7613;
/** Ignore elevation wiggles smaller than this (meters) when summing gain/loss. */
const ELEVATION_NOISE_THRESHOLD_M = 3;

// ============================================================================
// PARSING
// ============================================================================

/** Extract track (or route) points from GPX XML. Invalid points are skipped. */
export function parseGpx(xml: string): GpxPoint[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml');
  let nodes = doc.getElementsByTagName('trkpt');
  if (nodes.length === 0) nodes = doc.getElementsByTagName('rtept');

  const points: GpxPoint[] = [];
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

// ============================================================================
// GEOMETRY
// ============================================================================

/** Great-circle distance between two coordinates, in miles. */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

// ============================================================================
// METRICS
// ============================================================================

/**
 * Compute cumulative distances, bounds, and elevation stats for a route.
 * Elevation gain/loss uses a small hysteresis threshold so GPS jitter does
 * not inflate the numbers. Returns null when there are fewer than 2 points.
 */
export function computeRouteMetrics(rawPoints: GpxPoint[]): RouteMetrics | null {
  if (rawPoints.length < 2) return null;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minEleM = Infinity;
  let maxEleM = -Infinity;
  let eleCount = 0;

  let cumulative = 0;
  const points: RoutePoint[] = [];

  // Gain/loss hysteresis anchor (meters)
  let anchorEleM: number | null = null;
  let gainM = 0;
  let lossM = 0;

  for (let i = 0; i < rawPoints.length; i++) {
    const p = rawPoints[i];
    if (i > 0) {
      const prev = rawPoints[i - 1];
      cumulative += haversineMiles(prev.lat, prev.lon, p.lat, p.lon);
    }

    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);

    if (p.ele !== undefined) {
      eleCount++;
      minEleM = Math.min(minEleM, p.ele);
      maxEleM = Math.max(maxEleM, p.ele);

      if (anchorEleM === null) {
        anchorEleM = p.ele;
      } else {
        const delta = p.ele - anchorEleM;
        if (Math.abs(delta) >= ELEVATION_NOISE_THRESHOLD_M) {
          if (delta > 0) gainM += delta;
          else lossM += -delta;
          anchorEleM = p.ele;
        }
      }
    }

    points.push({
      lat: p.lat,
      lon: p.lon,
      eleFt: p.ele !== undefined ? p.ele * FEET_PER_METER : null,
      distanceMi: cumulative,
    });
  }

  const hasElevation = eleCount >= 2;

  return {
    points,
    bounds: { minLat, maxLat, minLon, maxLon },
    totalDistanceMi: cumulative,
    hasElevation,
    elevationGainFt: hasElevation ? gainM * FEET_PER_METER : null,
    elevationLossFt: hasElevation ? lossM * FEET_PER_METER : null,
    minElevationFt: hasElevation ? minEleM * FEET_PER_METER : null,
    maxElevationFt: hasElevation ? maxEleM * FEET_PER_METER : null,
  };
}

// ============================================================================
// MAP HELPERS
// ============================================================================

/** A react-native-maps region covering the bounds, with breathing room. */
export function routeRegion(bounds: RouteBounds, padFactor = 1.25): RouteRegion {
  const latDelta = Math.max((bounds.maxLat - bounds.minLat) * padFactor, 0.005);
  const lonDelta = Math.max((bounds.maxLon - bounds.minLon) * padFactor, 0.005);
  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLon + bounds.maxLon) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lonDelta,
  };
}

/** Interpolated position on the route at a given cumulative distance. */
export function pointAtDistance(points: RoutePoint[], distanceMi: number): RoutePoint {
  const total = points[points.length - 1].distanceMi;
  const d = Math.min(Math.max(distanceMi, 0), total);

  // Binary search for the first point at or beyond d
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (points[mid].distanceMi < d) lo = mid + 1;
    else hi = mid;
  }

  const after = points[lo];
  if (lo === 0) return after;
  const before = points[lo - 1];

  const segment = after.distanceMi - before.distanceMi;
  const t = segment > 0 ? (d - before.distanceMi) / segment : 0;

  const eleFt =
    before.eleFt !== null && after.eleFt !== null
      ? before.eleFt + (after.eleFt - before.eleFt) * t
      : (after.eleFt ?? before.eleFt);

  return {
    lat: before.lat + (after.lat - before.lat) * t,
    lon: before.lon + (after.lon - before.lon) * t,
    eleFt,
    distanceMi: d,
  };
}

/** Marker positions every `intervalMi` miles along the route (5, 10, 15…). */
export function mileMarkers(points: RoutePoint[], intervalMi = 5): MileMarker[] {
  if (points.length < 2 || intervalMi <= 0) return [];
  const total = points[points.length - 1].distanceMi;
  const markers: MileMarker[] = [];
  for (let mile = intervalMi; mile < total; mile += intervalMi) {
    const p = pointAtDistance(points, mile);
    markers.push({ mile, lat: p.lat, lon: p.lon });
  }
  return markers;
}

// ============================================================================
// CHART HELPERS
// ============================================================================

/**
 * Downsample the route into at most `maxSamples` elevation samples spaced
 * evenly by distance. Points without elevation are skipped.
 */
export function elevationSamples(points: RoutePoint[], maxSamples = 140): ElevationSample[] {
  const withEle = points.filter((p): p is RoutePoint & { eleFt: number } => p.eleFt !== null);
  if (withEle.length === 0) return [];
  if (withEle.length <= maxSamples) {
    return withEle.map(p => ({ distanceMi: p.distanceMi, eleFt: p.eleFt }));
  }

  const samples: ElevationSample[] = [];
  const step = (withEle.length - 1) / (maxSamples - 1);
  for (let i = 0; i < maxSamples; i++) {
    const p = withEle[Math.round(i * step)];
    samples.push({ distanceMi: p.distanceMi, eleFt: p.eleFt });
  }
  return samples;
}

/** Round-numbered axis tick values covering [min, max]. */
export function niceTicks(min: number, max: number, targetCount = 4): number[] {
  if (!isFinite(min) || !isFinite(max) || targetCount < 2) return [];
  if (min === max) return [min];

  const rawStep = (max - min) / (targetCount - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  let niceResidual: number;
  if (residual <= 1) niceResidual = 1;
  else if (residual <= 2) niceResidual = 2;
  else if (residual <= 5) niceResidual = 5;
  else niceResidual = 10;
  const step = niceResidual * magnitude;

  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) {
    // Snap away floating point drift (e.g. 0.30000000000000004)
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}

/** Compact number formatting for stats/labels: 11,712 style. */
export function formatFeet(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function formatMiles(value: number): string {
  return value >= 100 ? Math.round(value).toLocaleString('en-US') : value.toFixed(1);
}
