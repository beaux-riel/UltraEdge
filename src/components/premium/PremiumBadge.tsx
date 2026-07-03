/**
 * PremiumBadge Component
 * Small badge to indicate premium features
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

type BadgeSize = 'sm' | 'md' | 'lg';
type BadgeVariant = 'filled' | 'outline' | 'subtle';

interface PremiumBadgeProps {
  size?: BadgeSize;
  variant?: BadgeVariant;
  showIcon?: boolean;
  label?: string;
  style?: ViewStyle;
}

export function PremiumBadge({
  size = 'md',
  variant = 'filled',
  showIcon = true,
  label = 'PRO',
  style,
}: PremiumBadgeProps) {
  const { theme } = useTheme();
  const { colors, typography, radius } = theme;

  const sizeConfig = {
    sm: { height: 18, fontSize: 9, iconSize: 10, paddingH: 6, gap: 2 },
    md: { height: 22, fontSize: 10, iconSize: 12, paddingH: 8, gap: 3 },
    lg: { height: 28, fontSize: 12, iconSize: 14, paddingH: 10, gap: 4 },
  };

  const config = sizeConfig[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          container: {
            backgroundColor: colors.sunrise,
          },
          text: {
            color: colors.snow,
          },
          iconColor: colors.snow,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: colors.sunrise,
          },
          text: {
            color: colors.sunrise,
          },
          iconColor: colors.sunrise,
        };
      case 'subtle':
        return {
          container: {
            backgroundColor: theme.mode === 'dark' 
              ? 'rgba(255, 155, 108, 0.15)' 
              : 'rgba(224, 123, 76, 0.12)',
          },
          text: {
            color: colors.sunrise,
          },
          iconColor: colors.sunrise,
        };
      default:
        return {
          container: {},
          text: {},
          iconColor: colors.sunrise,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View
      style={[
        styles.container,
        {
          height: config.height,
          paddingHorizontal: config.paddingH,
          borderRadius: config.height / 2,
          gap: config.gap,
        },
        variantStyles.container,
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name="star"
          size={config.iconSize}
          color={variantStyles.iconColor}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            fontSize: config.fontSize,
            fontFamily: typography.label.fontFamily,
            letterSpacing: typography.label.letterSpacing,
          },
          variantStyles.text,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// Convenience variant for inline use
export function PremiumIndicator({ style }: { style?: ViewStyle }) {
  return <PremiumBadge size="sm" variant="subtle" showIcon={false} style={style} />;
}

// Lock icon variant for gated features
export function PremiumLockBadge({ style }: { style?: ViewStyle }) {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.lockBadge,
        {
          backgroundColor: theme.mode === 'dark' 
            ? 'rgba(255, 155, 108, 0.2)' 
            : 'rgba(224, 123, 76, 0.15)',
        },
        style,
      ]}
    >
      <Ionicons name="lock-closed" size={12} color={theme.colors.sunrise} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  lockBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PremiumBadge;
