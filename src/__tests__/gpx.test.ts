/**
 * Unit tests for src/lib/gpx.ts display-unit helpers and the
 * GPX → event-stats conversion used by the import flow.
 */

import {
  milesToUnit,
  feetToUnit,
  distanceUnitLabel,
  elevationUnitLabel,
  elevationUnitForDistance,
  eventStatsFromRoute,
  distanceMarkers,
  parseGpx,
  computeRouteMetrics,
  MILES_TO_KM,
  FEET_TO_METERS,
} from '../lib/gpx';

describe('display unit helpers', () => {
  it('converts miles to kilometers and passes miles through', () => {
    expect(milesToUnit(10, 'miles')).toBe(10);
    expect(milesToUnit(10, 'kilometers')).toBeCloseTo(10 * MILES_TO_KM, 6);
  });

  it('converts feet to meters and passes feet through', () => {
    expect(feetToUnit(1000, 'feet')).toBe(1000);
    expect(feetToUnit(1000, 'meters')).toBeCloseTo(1000 * FEET_TO_METERS, 6);
  });

  it('labels units', () => {
    expect(distanceUnitLabel('miles')).toBe('mi');
    expect(distanceUnitLabel('kilometers')).toBe('km');
    expect(elevationUnitLabel('feet')).toBe('ft');
    expect(elevationUnitLabel('meters')).toBe('m');
  });

  it('pairs elevation units with distance units', () => {
    expect(elevationUnitForDistance('miles')).toBe('feet');
    expect(elevationUnitForDistance('kilometers')).toBe('meters');
  });
});

describe('eventStatsFromRoute', () => {
  const stats = {
    totalDistanceMi: 100.16,
    elevationGainFt: 11712.4,
    elevationLossFt: 11698.6,
  };

  it('produces imperial event fields', () => {
    expect(eventStatsFromRoute(stats, 'miles', 'feet')).toEqual({
      total_distance: 100.2,
      total_elevation_gain: 11712,
      total_elevation_loss: 11699,
    });
  });

  it('produces metric event fields', () => {
    const result = eventStatsFromRoute(stats, 'kilometers', 'meters');
    expect(result.total_distance).toBeCloseTo(161.2, 1);
    expect(result.total_elevation_gain).toBe(Math.round(11712.4 * FEET_TO_METERS));
    expect(result.total_elevation_loss).toBe(Math.round(11698.6 * FEET_TO_METERS));
  });

  it('keeps null elevations null', () => {
    expect(
      eventStatsFromRoute(
        { totalDistanceMi: 26.2, elevationGainFt: null, elevationLossFt: null },
        'miles',
        'feet'
      )
    ).toEqual({
      total_distance: 26.2,
      total_elevation_gain: null,
      total_elevation_loss: null,
    });
  });
});

describe('distanceMarkers with display units', () => {
  // Straight north-south line, ~0.6214 mi per 0.009° of latitude (~1 km)
  const gpx = (count: number) => {
    let pts = '';
    for (let i = 0; i < count; i++) {
      pts += `<trkpt lat="${(45 + i * 0.009).toFixed(4)}" lon="-120.0"><ele>100</ele></trkpt>`;
    }
    return `<gpx><trk><trkseg>${pts}</trkseg></trk></gpx>`;
  };

  const metrics = computeRouteMetrics(parseGpx(gpx(25)))!;

  it('emits kilometer markers spaced by the km interval', () => {
    // 24 segments of ~1 km each → ~24 km total
    const markers = distanceMarkers(metrics.points, 5, 'kilometers');
    expect(markers.map(m => m.value)).toEqual([5, 10, 15, 20]);
    expect(metrics.totalDistanceMi * MILES_TO_KM).toBeGreaterThan(20);
  });

  it('emits mile markers spaced by the mile interval', () => {
    const markers = distanceMarkers(metrics.points, 5, 'miles');
    for (const m of markers) {
      expect(m.value % 5).toBe(0);
      expect(m.value).toBeLessThan(metrics.totalDistanceMi);
    }
  });

  it('returns no markers for a non-positive interval', () => {
    expect(distanceMarkers(metrics.points, 0, 'miles')).toEqual([]);
  });
});
