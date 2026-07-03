/**
 * Elevation profile chart with labeled axes (elevation ft/m, distance mi/km)
 * and gridlines. Optionally supports touch scrubbing: dragging across the
 * chart reports the corresponding route distance so a parent can highlight
 * that position on the map.
 *
 * Axis-label layout: edge labels are anchored inward ('start' at the left
 * edge, 'end' at the right edge) so the first and last labels always render
 * fully inside the SVG at any width — a middle-anchored label at the plot's
 * right edge previously overflowed the viewport and was clipped. The distance
 * unit is appended to the final tick label instead of drawn as a separate
 * overlapping text element.
 */

import React, { useMemo } from 'react';
import { View, ViewStyle, GestureResponderEvent } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';

import { useTheme } from '../../theme';
import {
  RouteMetrics,
  elevationSamples,
  niceTicks,
  pointAtDistance,
  milesToUnit,
  feetToUnit,
  distanceUnitLabel,
  elevationUnitLabel,
  elevationUnitForDistance,
} from '../../lib/gpx';
import type { DistanceUnit } from '../../lib/database.types';

const PAD_LEFT = 42;
const PAD_RIGHT = 14;
const PAD_TOP = 8;
const PAD_BOTTOM = 22;
/** Labels within this many px of a plot edge get anchored inward. */
const EDGE_ANCHOR_PX = 16;

interface ElevationProfileProps {
  metrics: RouteMetrics;
  width: number;
  height: number;
  /** Display unit for the distance axis; elevation follows (mi→ft, km→m). */
  distanceUnit?: DistanceUnit;
  /** When set, the chart becomes a scrubber. Called with null on release. */
  onScrub?: (distanceMi: number | null) => void;
  scrubDistanceMi?: number | null;
  style?: ViewStyle;
}

export default function ElevationProfile({
  metrics,
  width,
  height,
  distanceUnit = 'miles',
  onScrub,
  scrubDistanceMi = null,
  style,
}: ElevationProfileProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const plotW = Math.max(width - PAD_LEFT - PAD_RIGHT, 1);
  const plotH = Math.max(height - PAD_TOP - PAD_BOTTOM, 1);
  const totalMi = metrics.totalDistanceMi;
  const elevationUnit = elevationUnitForDistance(distanceUnit);

  const chart = useMemo(() => {
    const samples = elevationSamples(metrics.points);
    if (samples.length < 2 || totalMi <= 0) return null;

    const toDist = (mi: number) => milesToUnit(mi, distanceUnit);
    const toEle = (ft: number) => feetToUnit(ft, elevationUnit);
    const totalDist = toDist(totalMi);

    const yTicks = niceTicks(
      toEle(metrics.minElevationFt ?? 0),
      toEle(metrics.maxElevationFt ?? 0),
      4
    );
    if (yTicks.length === 0) return null;
    const yMin = yTicks[0];
    const yMax = Math.max(yTicks[yTicks.length - 1], yMin + 1);

    // Choose a distance tick interval that yields ~4-6 labels
    const intervals = [0.5, 1, 2, 5, 10, 20, 25, 50, 100];
    const xInterval = intervals.find(i => totalDist / i <= 6) ?? 100;
    const xTicks: number[] = [];
    for (let d = 0; d <= totalDist; d += xInterval) xTicks.push(d);

    const xFor = (dist: number) => PAD_LEFT + (dist / totalDist) * plotW;
    const yFor = (ele: number) => PAD_TOP + plotH - ((ele - yMin) / (yMax - yMin)) * plotH;

    let line = '';
    samples.forEach((s, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      line += `${cmd}${xFor(toDist(s.distanceMi)).toFixed(1)},${yFor(toEle(s.eleFt)).toFixed(1)} `;
    });
    const area =
      line +
      `L${xFor(toDist(samples[samples.length - 1].distanceMi)).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} ` +
      `L${xFor(toDist(samples[0].distanceMi)).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} Z`;

    return { line: line.trim(), area, yTicks, xTicks, yMin, yMax, xFor, yFor, toDist, toEle };
  }, [metrics, totalMi, plotW, plotH, distanceUnit, elevationUnit]);

  const scrub = useMemo(() => {
    if (!chart || scrubDistanceMi === null) return null;
    const p = pointAtDistance(metrics.points, scrubDistanceMi);
    if (p.eleFt === null) return null;
    return { x: chart.xFor(chart.toDist(p.distanceMi)), y: chart.yFor(chart.toEle(p.eleFt)) };
  }, [chart, scrubDistanceMi, metrics]);

  if (!chart) return null;

  const handleTouch = (event: GestureResponderEvent) => {
    if (!onScrub) return;
    const x = event.nativeEvent.locationX;
    const ratio = Math.min(Math.max((x - PAD_LEFT) / plotW, 0), 1);
    onScrub(ratio * totalMi);
  };

  const responderProps = onScrub
    ? {
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponder: () => true,
        onResponderGrant: handleTouch,
        onResponderMove: handleTouch,
        onResponderRelease: () => onScrub(null),
        onResponderTerminate: () => onScrub(null),
      }
    : {};

  /** Keep edge labels inside the plot: anchor inward near either edge. */
  const anchorFor = (x: number): 'start' | 'middle' | 'end' => {
    if (x <= PAD_LEFT + EDGE_ANCHOR_PX) return 'start';
    if (x >= PAD_LEFT + plotW - EDGE_ANCHOR_PX) return 'end';
    return 'middle';
  };

  const distUnitLabel = distanceUnitLabel(distanceUnit);
  const lastTickIndex = chart.xTicks.length - 1;

  return (
    <View style={[{ width, height }, style]} {...responderProps}>
      <Svg width={width} height={height} pointerEvents="none">
        {/* Horizontal gridlines + elevation labels */}
        {chart.yTicks.map(ele => {
          const y = chart.yFor(ele);
          if (y < PAD_TOP - 1 || y > PAD_TOP + plotH + 1) return null;
          return (
            <React.Fragment key={`y-${ele}`}>
              <Line
                x1={PAD_LEFT}
                y1={y}
                x2={PAD_LEFT + plotW}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
              />
              <SvgText
                x={PAD_LEFT - 6}
                y={y + 3}
                fontSize={9}
                fill={colors.mist}
                textAnchor="end"
              >
                {Math.round(ele).toLocaleString('en-US')}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Vertical gridlines + distance labels (unit appended to last tick) */}
        {chart.xTicks.map((dist, index) => {
          const x = chart.xFor(dist);
          const label = index === lastTickIndex ? `${xInt(dist)} ${distUnitLabel}` : xInt(dist);
          return (
            <React.Fragment key={`x-${dist}`}>
              <Line
                x1={x}
                y1={PAD_TOP}
                x2={x}
                y2={PAD_TOP + plotH}
                stroke={colors.borderLight}
                strokeWidth={1}
              />
              <SvgText
                x={x}
                y={PAD_TOP + plotH + 13}
                fontSize={9}
                fill={colors.mist}
                textAnchor={anchorFor(x)}
              >
                {label}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Elevation unit label */}
        <SvgText x={PAD_LEFT - 6} y={PAD_TOP - 1} fontSize={8} fill={colors.mist} textAnchor="end">
          {elevationUnitLabel(elevationUnit)}
        </SvgText>

        {/* Profile area + line */}
        <Path d={chart.area} fill={colors.forest} opacity={0.15} />
        <Path
          d={chart.line}
          stroke={colors.forest}
          strokeWidth={2}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Scrub indicator */}
        {scrub && (
          <>
            <Line
              x1={scrub.x}
              y1={PAD_TOP}
              x2={scrub.x}
              y2={PAD_TOP + plotH}
              stroke={colors.sky}
              strokeWidth={1.5}
            />
            <Circle
              cx={scrub.x}
              cy={scrub.y}
              r={5}
              fill={colors.sky}
              stroke={colors.surface}
              strokeWidth={2}
            />
          </>
        )}
      </Svg>
    </View>
  );
}

/** Format a distance tick label without trailing .0 noise. */
function xInt(dist: number): string {
  return Number.isInteger(dist) ? String(dist) : dist.toFixed(1);
}
