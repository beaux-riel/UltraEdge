/**
 * Elevation profile chart with labeled axes (elevation ft / distance mi)
 * and gridlines. Optionally supports touch scrubbing: dragging across the
 * chart reports the corresponding route distance so a parent can highlight
 * that position on the map.
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
} from '../../lib/gpx';

const PAD_LEFT = 42;
const PAD_RIGHT = 10;
const PAD_TOP = 8;
const PAD_BOTTOM = 22;

interface ElevationProfileProps {
  metrics: RouteMetrics;
  width: number;
  height: number;
  /** When set, the chart becomes a scrubber. Called with null on release. */
  onScrub?: (distanceMi: number | null) => void;
  scrubDistanceMi?: number | null;
  style?: ViewStyle;
}

export default function ElevationProfile({
  metrics,
  width,
  height,
  onScrub,
  scrubDistanceMi = null,
  style,
}: ElevationProfileProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  const plotW = Math.max(width - PAD_LEFT - PAD_RIGHT, 1);
  const plotH = Math.max(height - PAD_TOP - PAD_BOTTOM, 1);
  const totalMi = metrics.totalDistanceMi;

  const chart = useMemo(() => {
    const samples = elevationSamples(metrics.points);
    if (samples.length < 2 || totalMi <= 0) return null;

    const yTicks = niceTicks(metrics.minElevationFt ?? 0, metrics.maxElevationFt ?? 0, 4);
    if (yTicks.length === 0) return null;
    const yMin = yTicks[0];
    const yMax = Math.max(yTicks[yTicks.length - 1], yMin + 1);

    // Choose a distance tick interval that yields ~4-6 labels
    const intervals = [0.5, 1, 2, 5, 10, 20, 25, 50, 100];
    const xInterval = intervals.find(i => totalMi / i <= 6) ?? 100;
    const xTicks: number[] = [];
    for (let mi = 0; mi <= totalMi; mi += xInterval) xTicks.push(mi);

    const xFor = (mi: number) => PAD_LEFT + (mi / totalMi) * plotW;
    const yFor = (ft: number) => PAD_TOP + plotH - ((ft - yMin) / (yMax - yMin)) * plotH;

    let line = '';
    samples.forEach((s, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      line += `${cmd}${xFor(s.distanceMi).toFixed(1)},${yFor(s.eleFt).toFixed(1)} `;
    });
    const area =
      line +
      `L${xFor(samples[samples.length - 1].distanceMi).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} ` +
      `L${xFor(samples[0].distanceMi).toFixed(1)},${(PAD_TOP + plotH).toFixed(1)} Z`;

    return { line: line.trim(), area, yTicks, xTicks, yMin, yMax, xFor, yFor };
  }, [metrics, totalMi, plotW, plotH]);

  const scrub = useMemo(() => {
    if (!chart || scrubDistanceMi === null) return null;
    const p = pointAtDistance(metrics.points, scrubDistanceMi);
    if (p.eleFt === null) return null;
    return { x: chart.xFor(p.distanceMi), y: chart.yFor(p.eleFt) };
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

  return (
    <View style={[{ width, height }, style]} {...responderProps}>
      <Svg width={width} height={height} pointerEvents="none">
        {/* Horizontal gridlines + elevation labels */}
        {chart.yTicks.map(ft => {
          const y = chart.yFor(ft);
          if (y < PAD_TOP - 1 || y > PAD_TOP + plotH + 1) return null;
          return (
            <React.Fragment key={`y-${ft}`}>
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
                {Math.round(ft).toLocaleString('en-US')}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Vertical gridlines + distance labels */}
        {chart.xTicks.map(mi => {
          const x = chart.xFor(mi);
          return (
            <React.Fragment key={`x-${mi}`}>
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
                textAnchor={mi === 0 ? 'start' : 'middle'}
              >
                {xInt(mi)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* Axis unit labels */}
        <SvgText x={PAD_LEFT - 6} y={PAD_TOP - 1} fontSize={8} fill={colors.mist} textAnchor="end">
          ft
        </SvgText>
        <SvgText
          x={PAD_LEFT + plotW}
          y={PAD_TOP + plotH + 13}
          fontSize={9}
          fill={colors.mist}
          textAnchor="end"
        >
          mi
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
function xInt(mi: number): string {
  return Number.isInteger(mi) ? String(mi) : mi.toFixed(1);
}
