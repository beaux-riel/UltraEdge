/**
 * FeatureGate Component
 * Wrapper that shows children if premium, otherwise shows upgrade CTA
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { PremiumBadge, PremiumLockBadge } from './PremiumBadge';
import { useOptionalSubscription } from '../../context/SubscriptionContext';
import { PremiumFeature } from '../../config/revenuecat';

type GateVariant = 'overlay' | 'inline' | 'replace' | 'blur';

interface FeatureGateProps {
  children: React.ReactNode;
  feature?: string; // Feature name for tracking/copy customization
  variant?: GateVariant;
  onUpgradePress?: () => void;
  isPremium?: boolean; // Override for testing, normally from context
  title?: string;
  description?: string;
  style?: ViewStyle;
}

export function FeatureGate({
  children,
  feature,
  variant = 'replace',
  onUpgradePress,
  isPremium: isPremiumOverride,
  title,
  description,
  style,
}: FeatureGateProps) {
  const { theme } = useTheme();
  const { colors, typography, radius, spacing } = theme;

  // Real subscription state. Reconciled between the RevenueCat SDK cache and
  // the server-side user_subscriptions record; null when no provider is
  // mounted (isolated tests) — treated as not premium. The explicit
  // isPremium prop still wins so screens/tests can force a state.
  const subscription = useOptionalSubscription();
  const contextHasAccess = feature
    ? subscription?.hasFeatureAccess(feature as PremiumFeature) ?? false
    : subscription?.isPremium ?? false;
  const isPremium = isPremiumOverride ?? contextHasAccess;

  // If user is premium, just render children
  if (isPremium) {
    return <>{children}</>;
  }

  const handleUpgradePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpgradePress?.();
  };

  const defaultTitle = title || 'Premium Feature';
  const defaultDescription =
    description ??
    (feature
      ? `${feature} is available with UltraEdge Pro`
      : 'This feature is available with UltraEdge Pro');

  // Render based on variant
  switch (variant) {
    case 'overlay':
      // Shows children with an overlay blocking interaction
      return (
        <View style={[styles.overlayContainer, style]}>
          <View style={styles.childrenWrapper} pointerEvents="none">
            {children}
          </View>
          <View
            style={[
              styles.overlay,
              {
                backgroundColor: theme.mode === 'dark'
                  ? 'rgba(15, 13, 11, 0.85)'
                  : 'rgba(250, 247, 242, 0.9)',
              },
            ]}
          >
            <OverlayContent
              title={defaultTitle}
              description={defaultDescription}
              onUpgrade={handleUpgradePress}
            />
          </View>
        </View>
      );

    case 'blur':
      // Shows blurred children with upgrade CTA
      return (
        <View style={[styles.overlayContainer, style]}>
          <View 
            style={[
              styles.childrenWrapper, 
              styles.blurredContent,
              { opacity: 0.3 }
            ]} 
            pointerEvents="none"
          >
            {children}
          </View>
          <View style={styles.blurOverlay}>
            <OverlayContent
              title={defaultTitle}
              description={defaultDescription}
              onUpgrade={handleUpgradePress}
            />
          </View>
        </View>
      );

    case 'inline':
      // Shows a compact inline upgrade prompt
      return (
        <TouchableOpacity
          onPress={handleUpgradePress}
          activeOpacity={0.9}
          style={[
            styles.inlineContainer,
            {
              backgroundColor: colors.cream,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.border,
            },
            style,
          ]}
        >
          <View style={styles.inlineContent}>
            <PremiumLockBadge />
            <View style={styles.inlineTextContainer}>
              <Text
                style={[
                  styles.inlineTitle,
                  {
                    color: colors.bark,
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
              >
                {defaultTitle}
              </Text>
              <Text
                style={[
                  styles.inlineDescription,
                  {
                    color: colors.stone,
                    fontFamily: typography.bodySmall.fontFamily,
                    fontSize: typography.bodySmall.fontSize,
                  },
                ]}
              >
                Tap to unlock
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.mist} />
          </View>
        </TouchableOpacity>
      );

    case 'replace':
    default:
      // Completely replaces children with upgrade CTA
      return (
        <View
          style={[
            styles.replaceContainer,
            {
              backgroundColor: colors.cream,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.border,
            },
            style,
          ]}
        >
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.mode === 'dark'
                  ? 'rgba(255, 155, 108, 0.15)'
                  : 'rgba(224, 123, 76, 0.1)',
              },
            ]}
          >
            <Ionicons name="lock-closed" size={24} color={colors.sunrise} />
          </View>

          <PremiumBadge variant="subtle" style={styles.badge} />

          <Text
            style={[
              styles.replaceTitle,
              {
                color: colors.bark,
                fontFamily: typography.h3.fontFamily,
                fontSize: typography.h3.fontSize,
              },
            ]}
          >
            {defaultTitle}
          </Text>

          <Text
            style={[
              styles.replaceDescription,
              {
                color: colors.stone,
                fontFamily: typography.body.fontFamily,
                fontSize: typography.body.fontSize,
              },
            ]}
          >
            {defaultDescription}
          </Text>

          <TouchableOpacity
            onPress={handleUpgradePress}
            activeOpacity={0.8}
            style={[
              styles.upgradeButton,
              {
                backgroundColor: colors.sunrise,
                borderRadius: radius.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.upgradeButtonText,
                {
                  color: colors.snow,
                  fontFamily: typography.label.fontFamily,
                  fontSize: 13,
                },
              ]}
            >
              Upgrade to Pro
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.snow} />
          </TouchableOpacity>
        </View>
      );
  }
}

// Shared overlay content component
function OverlayContent({
  title,
  description,
  onUpgrade,
}: {
  title: string;
  description: string;
  onUpgrade?: () => void;
}) {
  const { theme } = useTheme();
  const { colors, typography, radius } = theme;

  return (
    <View style={styles.overlayContent}>
      <View
        style={[
          styles.overlayIconCircle,
          {
            backgroundColor: theme.mode === 'dark'
              ? 'rgba(255, 155, 108, 0.2)'
              : 'rgba(224, 123, 76, 0.12)',
          },
        ]}
      >
        <Ionicons name="lock-closed" size={28} color={colors.sunrise} />
      </View>

      <Text
        style={[
          styles.overlayTitle,
          {
            color: colors.bark,
            fontFamily: typography.h3.fontFamily,
            fontSize: typography.h3.fontSize,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.overlayDescription,
          {
            color: colors.stone,
            fontFamily: typography.body.fontFamily,
            fontSize: typography.body.fontSize,
          },
        ]}
      >
        {description}
      </Text>

      <TouchableOpacity
        onPress={onUpgrade}
        activeOpacity={0.8}
        style={[
          styles.overlayButton,
          {
            backgroundColor: colors.sunrise,
            borderRadius: radius.full,
          },
        ]}
      >
        <Ionicons name="star" size={16} color={colors.snow} />
        <Text
          style={[
            styles.overlayButtonText,
            {
              color: colors.snow,
              fontFamily: typography.label.fontFamily,
              fontSize: 13,
            },
          ]}
        >
          Unlock Feature
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Convenience component for list items
export function GatedListItem({
  children,
  onUpgradePress,
  isPremium,
  style,
}: {
  children: React.ReactNode;
  onUpgradePress?: () => void;
  isPremium?: boolean;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();

  // Prop override wins; otherwise use the real subscription context
  // (null-safe: no provider = not premium).
  const subscription = useOptionalSubscription();
  const isUnlocked = isPremium ?? subscription?.isPremium ?? false;

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <TouchableOpacity
      onPress={onUpgradePress}
      activeOpacity={0.8}
      style={[styles.gatedListItem, style]}
    >
      <View style={styles.gatedListItemContent} pointerEvents="none">
        {children}
      </View>
      <PremiumLockBadge />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Overlay variant
  overlayContainer: {
    position: 'relative',
  },
  childrenWrapper: {
    opacity: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  overlayContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  overlayIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overlayTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  overlayDescription: {
    textAlign: 'center',
    marginBottom: 20,
  },
  overlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  overlayButtonText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Blur variant
  blurredContent: {
    filter: 'blur(4px)',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  // Inline variant
  inlineContainer: {
    padding: 12,
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inlineTextContainer: {
    flex: 1,
  },
  inlineTitle: {
    fontWeight: '500',
  },
  inlineDescription: {
    marginTop: 2,
  },

  // Replace variant
  replaceContainer: {
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  badge: {
    marginBottom: 12,
  },
  replaceTitle: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  replaceDescription: {
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 260,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  upgradeButtonText: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Gated list item
  gatedListItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gatedListItemContent: {
    flex: 1,
    opacity: 0.5,
  },
});

export default FeatureGate;
