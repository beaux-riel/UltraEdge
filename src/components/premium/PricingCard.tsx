/**
 * PricingCard Component
 * Individual pricing option card for upgrade flow
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

export type PricingTier = 'monthly' | 'annual' | 'lifetime';

interface PricingCardProps {
  tier: PricingTier;
  price: string;
  period?: string;
  savings?: string;
  isHighlighted?: boolean;
  highlightLabel?: string;
  ctaText: string;
  onSelect: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  isSelected?: boolean;
  style?: ViewStyle;
}

export function PricingCard({
  tier,
  price,
  period,
  savings,
  isHighlighted = false,
  highlightLabel = 'Best Value',
  ctaText,
  onSelect,
  isLoading = false,
  disabled = false,
  isSelected = false,
  style,
}: PricingCardProps) {
  const { theme } = useTheme();
  const { colors, typography, radius, spacing, shadows } = theme;

  const handlePress = () => {
    if (disabled || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  const getTierIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (tier) {
      case 'monthly':
        return 'calendar-outline';
      case 'annual':
        return 'ribbon-outline';
      case 'lifetime':
        return 'infinite-outline';
      default:
        return 'star-outline';
    }
  };

  const getTierName = (): string => {
    switch (tier) {
      case 'monthly':
        return 'Monthly';
      case 'annual':
        return 'Annual';
      case 'lifetime':
        return 'Lifetime';
      default:
        return tier;
    }
  };

  const borderColor = isSelected
    ? colors.sunrise
    : isHighlighted
    ? colors.forest
    : colors.border;

  const backgroundColor = isSelected
    ? theme.mode === 'dark'
      ? 'rgba(255, 155, 108, 0.08)'
      : 'rgba(224, 123, 76, 0.06)'
    : colors.surface;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.9}
      style={[
        styles.container,
        {
          backgroundColor,
          borderRadius: radius.lg,
          borderWidth: isHighlighted || isSelected ? 2 : 1,
          borderColor,
          ...shadows.md,
        },
        style,
      ]}
    >
      {/* Highlight Badge */}
      {isHighlighted && (
        <View
          style={[
            styles.highlightBadge,
            {
              backgroundColor: colors.forest,
              borderRadius: radius.xs,
            },
          ]}
        >
          <Ionicons name="star" size={10} color={colors.snow} />
          <Text style={[styles.highlightText, { color: colors.snow, fontFamily: typography.label.fontFamily }]}>
            {highlightLabel}
          </Text>
        </View>
      )}

      {/* Card Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: isHighlighted
                  ? theme.mode === 'dark'
                    ? 'rgba(74, 139, 92, 0.2)'
                    : 'rgba(45, 90, 61, 0.1)'
                  : colors.cream,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Ionicons
              name={getTierIcon()}
              size={20}
              color={isHighlighted ? colors.forest : colors.trail}
            />
          </View>
          <View style={styles.tierInfo}>
            <Text
              style={[
                styles.tierName,
                {
                  color: colors.bark,
                  fontFamily: typography.h3.fontFamily,
                  fontSize: typography.h3.fontSize,
                },
              ]}
            >
              {getTierName()}
            </Text>
            {period && (
              <Text
                style={[
                  styles.period,
                  {
                    color: colors.stone,
                    fontFamily: typography.bodySmall.fontFamily,
                    fontSize: typography.bodySmall.fontSize,
                  },
                ]}
              >
                {period}
              </Text>
            )}
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text
            style={[
              styles.price,
              {
                color: colors.bark,
                fontFamily: typography.display.fontFamily,
                fontSize: 28,
              },
            ]}
          >
            {price}
          </Text>
          {savings && (
            <View
              style={[
                styles.savingsBadge,
                {
                  backgroundColor: theme.mode === 'dark'
                    ? 'rgba(107, 184, 122, 0.2)'
                    : 'rgba(90, 154, 107, 0.12)',
                  borderRadius: radius.full,
                },
              ]}
            >
              <Text
                style={[
                  styles.savingsText,
                  {
                    color: colors.meadow,
                    fontFamily: typography.label.fontFamily,
                    fontSize: 10,
                  },
                ]}
              >
                {savings}
              </Text>
            </View>
          )}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={handlePress}
          disabled={disabled || isLoading}
          activeOpacity={0.8}
          style={[
            styles.ctaButton,
            {
              backgroundColor: isHighlighted ? colors.forest : colors.trail,
              borderRadius: radius.sm,
              opacity: disabled ? 0.5 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.snow} />
          ) : (
            <Text
              style={[
                styles.ctaText,
                {
                  color: colors.snow,
                  fontFamily: typography.label.fontFamily,
                  fontSize: 13,
                },
              ]}
            >
              {ctaText}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Selection Indicator */}
      {isSelected && (
        <View
          style={[
            styles.selectedIndicator,
            { backgroundColor: colors.sunrise },
          ]}
        >
          <Ionicons name="checkmark" size={14} color={colors.snow} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  highlightBadge: {
    position: 'absolute',
    top: -1,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  highlightText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    padding: 16,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierInfo: {
    flex: 1,
  },
  tierName: {
    fontWeight: '600',
  },
  period: {
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  price: {
    fontWeight: '700',
  },
  savingsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  savingsText: {
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  ctaButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PricingCard;
