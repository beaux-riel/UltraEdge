/**
 * UpgradeBottomSheet Component
 * Modal showing pricing options for premium upgrade
 * Reusable — can be called from anywhere a premium feature is tapped
 */

import React, { useCallback, useMemo, forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { PricingCard, PricingTier } from './PricingCard';
import { RestoreLink } from './RestorePurchasesButton';
import { PremiumBadge } from './PremiumBadge';
import { useOptionalSubscription } from '../../context/SubscriptionContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fallback pricing data (used when store offerings haven't loaded, e.g.
// RevenueCat keys are placeholders or the device is offline). Real localized
// prices from the store are preferred when available.
const PRICING = {
  monthly: {
    price: '$5.99',
    period: 'per month',
    savings: undefined,
    ctaText: 'Start Monthly',
    isHighlighted: false,
  },
  annual: {
    price: '$39.99',
    period: 'per year',
    savings: 'Save 44%',
    ctaText: 'Go Annual — Best Value',
    isHighlighted: true,
  },
  lifetime: {
    price: '$89.99',
    period: 'one-time purchase',
    savings: undefined,
    ctaText: 'Get Lifetime Access',
    isHighlighted: false,
  },
} as const;

// Features to display
const PREMIUM_FEATURES = [
  { icon: 'cloud-outline', text: 'Cloud sync across all devices' },
  { icon: 'people-outline', text: 'Crew management & notifications' },
  { icon: 'scale-outline', text: 'Advanced weight tracking' },
  { icon: 'analytics-outline', text: 'Live race-day predictions' },
  { icon: 'share-social-outline', text: 'Unlimited event sharing' },
] as const;

export interface UpgradeBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface UpgradeBottomSheetProps {
  onPurchase?: (tier: PricingTier) => Promise<boolean>;
  onRestore?: () => Promise<boolean>;
  onDismiss?: () => void;
  featureName?: string; // Optional: which feature triggered this
}

export const UpgradeBottomSheet = forwardRef<UpgradeBottomSheetRef, UpgradeBottomSheetProps>(
  ({ onPurchase, onRestore, onDismiss, featureName }, ref) => {
    const { theme } = useTheme();
    const { colors, typography, radius, spacing, shadows } = theme;
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef<BottomSheet>(null);
    
    const [selectedTier, setSelectedTier] = useState<PricingTier>('annual');
    const [purchaseLoading, setPurchaseLoading] = useState<PricingTier | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Real subscription context (null-safe for isolated rendering). Used as
    // the default purchase/restore implementation when the parent doesn't
    // pass onPurchase/onRestore, and for real localized store prices.
    const subscription = useOptionalSubscription();

    const getPackageForTier = useCallback((tier: PricingTier) => {
      if (!subscription) return null;
      switch (tier) {
        case 'monthly':
          return subscription.getMonthlyPackage();
        case 'annual':
          return subscription.getAnnualPackage();
        case 'lifetime':
          return subscription.getLifetimePackage();
        default:
          return null;
      }
    }, [subscription]);

    /** Localized store price for a tier, falling back to reference pricing */
    const getPriceForTier = useCallback((tier: PricingTier): string => {
      const pkg = getPackageForTier(tier);
      return pkg?.product?.priceString ?? PRICING[tier].price;
    }, [getPackageForTier]);

    // Snap points
    const snapPoints = useMemo(() => {
      const contentHeight = Math.min(SCREEN_HEIGHT * 0.9, 720);
      return [contentHeight];
    }, []);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
      open: () => {
        setError(null);
        setPurchaseLoading(null);
        bottomSheetRef.current?.expand();
      },
      close: () => {
        bottomSheetRef.current?.close();
      },
    }));

    // Backdrop
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      ),
      []
    );

    // Handle purchase
    const handlePurchase = async (tier: PricingTier) => {
      if (purchaseLoading) return;
      
      setError(null);
      setPurchaseLoading(tier);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      try {
        if (onPurchase) {
          const success = await onPurchase(tier);
          if (success) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            bottomSheetRef.current?.close();
          }
        } else if (subscription) {
          // Default implementation: purchase via SubscriptionContext.
          // purchasePackage degrades gracefully (alerts, never crashes) when
          // RevenueCat isn't configured or the user cancels.
          const pkg = getPackageForTier(tier);
          if (!pkg) {
            setError(
              Platform.OS === 'web'
                ? 'Purchases are not available on web. Please use the iOS or Android app.'
                : 'This plan isn\u2019t available right now. Please try again later.'
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          } else {
            const success = await subscription.purchasePackage(pkg);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              bottomSheetRef.current?.close();
            }
          }
        } else {
          // No handler and no provider mounted — nothing we can do safely.
          setError('Purchases are not available right now.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Purchase failed';
        setError(message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } finally {
        setPurchaseLoading(null);
      }
    };

    // Handle restore
    const handleRestore = async (): Promise<boolean> => {
      if (onRestore) {
        const success = await onRestore();
        if (success) {
          bottomSheetRef.current?.close();
        }
        return success;
      }
      // Default implementation: restore via SubscriptionContext (alerts and
      // returns false gracefully when RevenueCat isn't configured).
      if (subscription) {
        const success = await subscription.restorePurchases();
        if (success) {
          bottomSheetRef.current?.close();
        }
        return success;
      }
      return false;
    };

    // Handle close
    const handleClose = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      bottomSheetRef.current?.close();
    };

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={onDismiss}
        backgroundStyle={{
          backgroundColor: colors.parchment,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
        }}
        handleIndicatorStyle={{
          backgroundColor: colors.mist,
          width: 40,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            style={[
              styles.closeButton,
              {
                backgroundColor: colors.cream,
                borderRadius: radius.full,
              },
            ]}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close" size={20} color={colors.stone} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
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
              <Ionicons name="trail-sign" size={32} color={colors.sunrise} />
            </View>

            <Text
              style={[
                styles.headline,
                {
                  color: colors.bark,
                  fontFamily: typography.h1.fontFamily,
                  fontSize: typography.h1.fontSize,
                },
              ]}
            >
              Unlock the Full Trail
            </Text>

            <Text
              style={[
                styles.subhead,
                {
                  color: colors.stone,
                  fontFamily: typography.body.fontFamily,
                  fontSize: typography.body.fontSize,
                },
              ]}
            >
              Cloud sync, crew features, and weight tracking for serious athletes
            </Text>

            {featureName && (
              <View
                style={[
                  styles.featureTag,
                  {
                    backgroundColor: colors.cream,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <Ionicons name="lock-open-outline" size={14} color={colors.trail} />
                <Text
                  style={[
                    styles.featureTagText,
                    {
                      color: colors.trail,
                      fontFamily: typography.bodySmall.fontFamily,
                      fontSize: typography.bodySmall.fontSize,
                    },
                  ]}
                >
                  Unlocks {featureName}
                </Text>
              </View>
            )}
          </View>

          {/* Features List */}
          <View style={styles.featuresSection}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View
                  style={[
                    styles.featureIcon,
                    {
                      backgroundColor: theme.mode === 'dark'
                        ? 'rgba(74, 139, 92, 0.15)'
                        : 'rgba(45, 90, 61, 0.08)',
                    },
                  ]}
                >
                  <Ionicons
                    name={feature.icon as keyof typeof Ionicons.glyphMap}
                    size={16}
                    color={colors.forest}
                  />
                </View>
                <Text
                  style={[
                    styles.featureText,
                    {
                      color: colors.bark,
                      fontFamily: typography.body.fontFamily,
                      fontSize: typography.body.fontSize,
                    },
                  ]}
                >
                  {feature.text}
                </Text>
              </View>
            ))}
          </View>

          {/* Error Message */}
          {error && (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: theme.mode === 'dark'
                    ? 'rgba(224, 115, 102, 0.15)'
                    : 'rgba(196, 91, 74, 0.1)',
                  borderRadius: radius.sm,
                },
              ]}
            >
              <Ionicons name="alert-circle" size={18} color={colors.clay} />
              <Text
                style={[
                  styles.errorText,
                  {
                    color: colors.clay,
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
              >
                {error}
              </Text>
            </View>
          )}

          {/* Pricing Cards */}
          <View style={styles.pricingSection}>
            {/* Annual - Best Value (shown first and highlighted) */}
            <PricingCard
              tier="annual"
              price={getPriceForTier('annual')}
              period={PRICING.annual.period}
              savings={PRICING.annual.savings}
              isHighlighted={PRICING.annual.isHighlighted}
              highlightLabel="Best Value"
              ctaText={PRICING.annual.ctaText}
              onSelect={() => handlePurchase('annual')}
              isLoading={purchaseLoading === 'annual'}
              disabled={purchaseLoading !== null && purchaseLoading !== 'annual'}
              style={styles.pricingCard}
            />

            {/* Monthly */}
            <PricingCard
              tier="monthly"
              price={getPriceForTier('monthly')}
              period={PRICING.monthly.period}
              ctaText={PRICING.monthly.ctaText}
              onSelect={() => handlePurchase('monthly')}
              isLoading={purchaseLoading === 'monthly'}
              disabled={purchaseLoading !== null && purchaseLoading !== 'monthly'}
              style={styles.pricingCard}
            />

            {/* Lifetime */}
            <PricingCard
              tier="lifetime"
              price={getPriceForTier('lifetime')}
              period={PRICING.lifetime.period}
              ctaText={PRICING.lifetime.ctaText}
              onSelect={() => handlePurchase('lifetime')}
              isLoading={purchaseLoading === 'lifetime'}
              disabled={purchaseLoading !== null && purchaseLoading !== 'lifetime'}
              style={styles.pricingCard}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <RestoreLink
              onRestore={handleRestore}
            />
            
            <Text
              style={[
                styles.legalText,
                {
                  color: colors.mist,
                  fontFamily: typography.caption.fontFamily,
                  fontSize: typography.caption.fontSize,
                },
              ]}
            >
              Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
              {Platform.OS === 'ios' ? ' Manage in Settings > Apple ID > Subscriptions.' : ' Manage in Play Store > Subscriptions.'}
            </Text>

            <View style={styles.legalLinks}>
              <TouchableOpacity>
                <Text
                  style={[
                    styles.legalLink,
                    {
                      color: colors.mist,
                      fontFamily: typography.caption.fontFamily,
                      fontSize: typography.caption.fontSize,
                    },
                  ]}
                >
                  Terms of Service
                </Text>
              </TouchableOpacity>
              <Text style={{ color: colors.mist }}>•</Text>
              <TouchableOpacity>
                <Text
                  style={[
                    styles.legalLink,
                    {
                      color: colors.mist,
                      fontFamily: typography.caption.fontFamily,
                      fontSize: typography.caption.fontSize,
                    },
                  ]}
                >
                  Privacy Policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

UpgradeBottomSheet.displayName = 'UpgradeBottomSheet';

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subhead: {
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
  },
  featureTagText: {
    fontWeight: '500',
  },
  featuresSection: {
    marginBottom: 24,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
  },
  pricingSection: {
    gap: 12,
    marginBottom: 24,
  },
  pricingCard: {
    // Additional styling if needed
  },
  footer: {
    alignItems: 'center',
    gap: 12,
  },
  legalText: {
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legalLink: {
    textDecorationLine: 'underline',
  },
});

export default UpgradeBottomSheet;
