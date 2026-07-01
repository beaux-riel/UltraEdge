/**
 * UltraEdge Weight Badge Component
 * Displays weight values with unit and optional threshold coloring
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { colors as themeColors } from '../../theme/colors';

type WeightUnit = 'g' | 'oz' | 'kg' | 'lbs';

interface WeightBadgeProps {
  weight: number;
  unit?: WeightUnit;
  targetWeight?: number; // For threshold coloring
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  showUnit?: boolean;
}

export function WeightBadge({
  weight,
  unit = 'g',
  targetWeight,
  size = 'md',
  style,
  showUnit = true,
}: WeightBadgeProps) {
  const { theme } = useTheme();
  const { colors, typography, radius, spacing } = theme;

  // Format weight for display
  const formatWeight = (w: number, u: WeightUnit): string => {
    if (u === 'g' && w >= 1000) {
      return `${(w / 1000).toFixed(1)}`;
    }
    if (u === 'oz' && w >= 16) {
      return `${(w / 16).toFixed(1)}`;
    }
    return w.toFixed(w % 1 === 0 ? 0 : 1);
  };

  // Get display unit (auto-convert if needed)
  const getDisplayUnit = (w: number, u: WeightUnit): string => {
    if (u === 'g' && w >= 1000) return 'kg';
    if (u === 'oz' && w >= 16) return 'lbs';
    return u;
  };

  // Get threshold color
  const getThresholdColor = (): string => {
    if (!targetWeight || targetWeight === 0) return colors.birch;

    const ratio = weight / targetWeight;

    if (ratio > 1) return themeColors.weight.over;
    if (ratio >= 0.9) return themeColors.weight.danger;
    if (ratio >= 0.7) return themeColors.weight.caution;
    return themeColors.weight.safe;
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      fontSize: 11,
      unitFontSize: 9,
    },
    md: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm + 2,
      fontSize: 13,
      unitFontSize: 10,
    },
    lg: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      fontSize: 15,
      unitFontSize: 12,
    },
  };

  const config = sizeConfig[size];
  const displayWeight = formatWeight(weight, unit);
  const displayUnit = getDisplayUnit(weight, unit);
  const backgroundColor = targetWeight ? `${getThresholdColor()}20` : colors.birch;
  const textColor = targetWeight ? getThresholdColor() : colors.stone;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          borderRadius: radius.xs,
          paddingVertical: config.paddingVertical,
          paddingHorizontal: config.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.weight,
          {
            color: textColor,
            fontSize: config.fontSize,
            fontFamily: typography.mono.fontFamily,
          },
        ]}
      >
        {displayWeight}
      </Text>
      {showUnit && (
        <Text
          style={[
            styles.unit,
            {
              color: textColor,
              fontSize: config.unitFontSize,
              fontFamily: typography.mono.fontFamily,
              opacity: 0.8,
            },
          ]}
        >
          {displayUnit}
        </Text>
      )}
    </View>
  );
}

// ============================================================================
// WEIGHT PROGRESS RING
// ============================================================================

interface WeightProgressRingProps {
  current: number;
  target: number;
  unit?: WeightUnit;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export function WeightProgressRing({
  current,
  target,
  unit = 'g',
  size = 80,
  strokeWidth = 8,
  showLabel = true,
}: WeightProgressRingProps) {
  const { theme } = useTheme();
  const { colors, typography } = theme;

  const ratio = Math.min(current / target, 1.2); // Cap at 120% for visual
  const percentage = Math.round(ratio * 100);

  // Get color based on threshold
  const getColor = (): string => {
    if (ratio > 1) return themeColors.weight.over;
    if (ratio >= 0.9) return themeColors.weight.danger;
    if (ratio >= 0.7) return themeColors.weight.caution;
    return themeColors.weight.safe;
  };

  const ringColor = getColor();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(ratio, 1));

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      {/* Background ring */}
      <View
        style={[
          styles.ringBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: colors.birch,
          },
        ]}
      />
      
      {/* Progress ring (simplified - would use SVG in production) */}
      <View
        style={[
          styles.ringProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: ringColor,
            borderTopColor: 'transparent',
            borderRightColor: ratio > 0.25 ? ringColor : 'transparent',
            borderBottomColor: ratio > 0.5 ? ringColor : 'transparent',
            borderLeftColor: ratio > 0.75 ? ringColor : 'transparent',
            transform: [{ rotate: '-135deg' }],
          },
        ]}
      />

      {/* Center label */}
      {showLabel && (
        <View style={styles.ringLabel}>
          <Text
            style={[
              styles.ringPercentage,
              {
                color: colors.bark,
                fontSize: size * 0.22,
                fontFamily: typography.mono.fontFamily,
                fontWeight: '600',
              },
            ]}
          >
            {percentage}%
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weight: {
    fontWeight: '500',
  },
  unit: {
    marginLeft: 2,
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringBackground: {
    position: 'absolute',
  },
  ringProgress: {
    position: 'absolute',
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentage: {},
});

export default WeightBadge;
