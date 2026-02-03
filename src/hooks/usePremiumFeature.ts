/**
 * usePremiumFeature Hook
 * 
 * Check if user has access to a specific premium feature.
 * Returns access status and helper functions for gating features.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const { hasAccess, requirePremium } = usePremiumFeature('crew_management');
 * 
 * if (!hasAccess) {
 *   return <UpgradePrompt />;
 * }
 * 
 * // With callback
 * const handlePress = requirePremium(() => {
 *   navigateToCrewScreen();
 * });
 * ```
 */

import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';

import { useSubscription } from '../context/SubscriptionContext';
import { PremiumFeature, PREMIUM_FEATURES } from '../config/revenuecat';

// =============================================================================
// Types
// =============================================================================

interface UsePremiumFeatureOptions {
  /** Custom message for upgrade prompt */
  upgradeMessage?: string;
  /** Whether to show alert when access is denied */
  showAlert?: boolean;
  /** Custom title for upgrade alert */
  alertTitle?: string;
  /** Custom callback when upgrade is needed */
  onUpgradeNeeded?: () => void;
}

interface UsePremiumFeatureResult {
  /** Whether user has access to this feature */
  hasAccess: boolean;
  /** Whether user is on free tier */
  isFree: boolean;
  /** Whether user has premium (any type) */
  isPremium: boolean;
  /** Whether user has lifetime premium */
  isLifetime: boolean;
  /** Current subscription tier */
  tier: 'free' | 'premium' | 'premium_lifetime';
  /** Whether subscription data is loading */
  isLoading: boolean;
  /** Wrap a function to require premium access */
  requirePremium: <T extends (...args: any[]) => any>(fn: T) => T;
  /** Show upgrade prompt */
  promptUpgrade: () => void;
  /** Available packages for purchase */
  packages: {
    monthly: PurchasesPackage | null;
    annual: PurchasesPackage | null;
    lifetime: PurchasesPackage | null;
  };
  /** Purchase a package */
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore purchases */
  restore: () => Promise<boolean>;
}

// =============================================================================
// Feature Descriptions
// =============================================================================

const FEATURE_DESCRIPTIONS: Record<PremiumFeature, string> = {
  // Cloud & Sync
  [PREMIUM_FEATURES.CLOUD_SYNC]: 'Cloud sync lets you access your events from any device.',
  [PREMIUM_FEATURES.AUTOMATIC_BACKUP]: 'Automatic backup protects your data in the cloud.',
  [PREMIUM_FEATURES.MULTI_DEVICE]: 'Use UltraEdge on multiple devices with seamless sync.',
  
  // Weight Tracking
  [PREMIUM_FEATURES.GEAR_WEIGHT]: 'Track the weight of your gear items.',
  [PREMIUM_FEATURES.DROP_BAG_WEIGHT]: 'See total weights for each drop bag.',
  [PREMIUM_FEATURES.NUTRITION_WEIGHT]: 'Track nutrition and hydration weights.',
  [PREMIUM_FEATURES.TOTAL_MOVING_WEIGHT]: 'Calculate your total moving weight at any point.',
  [PREMIUM_FEATURES.WEIGHT_PER_CHECKPOINT]: 'See weight breakdown at each checkpoint.',
  
  // Crew
  [PREMIUM_FEATURES.CREW_MANAGEMENT]: 'Invite and manage your race crew.',
  [PREMIUM_FEATURES.CREW_APP_ACCESS]: 'Your crew gets free access to view your plans.',
  [PREMIUM_FEATURES.CREW_NOTIFICATIONS]: 'Send real-time notifications to your crew.',
  
  // Sharing
  [PREMIUM_FEATURES.UNLIMITED_SHARING]: 'Share unlimited events with read-only links.',
  
  // Race Day
  [PREMIUM_FEATURES.LIVE_PREDICTIONS]: 'Get live ETA predictions on race day.',
  [PREMIUM_FEATURES.PACE_ANALYSIS]: 'Analyze your pace in real-time.',
  [PREMIUM_FEATURES.HISTORICAL_COMPARISON]: 'Compare with your historical race data.',
};

// =============================================================================
// Hook Implementation
// =============================================================================

export function usePremiumFeature(
  feature?: PremiumFeature,
  options: UsePremiumFeatureOptions = {}
): UsePremiumFeatureResult {
  const {
    upgradeMessage,
    showAlert = true,
    alertTitle = 'Premium Feature',
    onUpgradeNeeded,
  } = options;

  const {
    isPremium,
    isLifetime,
    tier,
    isLoading,
    hasFeatureAccess,
    purchasePackage,
    restorePurchases,
    getMonthlyPackage,
    getAnnualPackage,
    getLifetimePackage,
  } = useSubscription();

  // Check access for specific feature (or general premium status)
  const hasAccess = useMemo(() => {
    if (feature) {
      return hasFeatureAccess(feature);
    }
    return isPremium;
  }, [feature, hasFeatureAccess, isPremium]);

  const isFree = tier === 'free';

  // Get packages
  const packages = useMemo(() => ({
    monthly: getMonthlyPackage(),
    annual: getAnnualPackage(),
    lifetime: getLifetimePackage(),
  }), [getMonthlyPackage, getAnnualPackage, getLifetimePackage]);

  // Show upgrade prompt
  const promptUpgrade = useCallback(() => {
    const featureDesc = feature ? FEATURE_DESCRIPTIONS[feature] : 'This feature';
    const message = upgradeMessage || 
      `${featureDesc}\n\nUpgrade to Premium to unlock this and all other premium features.`;

    if (onUpgradeNeeded) {
      onUpgradeNeeded();
      return;
    }

    if (showAlert) {
      Alert.alert(
        alertTitle,
        message,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Learn More', onPress: () => {
            // This would typically navigate to a paywall screen
            // The consuming component should handle this via onUpgradeNeeded
            console.log('[Premium] User wants to learn more about upgrading');
          }},
        ]
      );
    }
  }, [feature, upgradeMessage, showAlert, alertTitle, onUpgradeNeeded]);

  // Wrapper to require premium for a function
  const requirePremium = useCallback(<T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: Parameters<T>) => {
      if (hasAccess) {
        return fn(...args);
      }
      promptUpgrade();
      return undefined;
    }) as T;
  }, [hasAccess, promptUpgrade]);

  // Purchase wrapper
  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    return purchasePackage(pkg);
  }, [purchasePackage]);

  // Restore wrapper
  const restore = useCallback(async (): Promise<boolean> => {
    return restorePurchases();
  }, [restorePurchases]);

  return {
    hasAccess,
    isFree,
    isPremium,
    isLifetime,
    tier,
    isLoading,
    requirePremium,
    promptUpgrade,
    packages,
    purchase,
    restore,
  };
}

// =============================================================================
// Convenience Hooks for Specific Features
// =============================================================================

/**
 * Check access to cloud sync feature
 */
export function useCloudSync(options?: UsePremiumFeatureOptions) {
  return usePremiumFeature(PREMIUM_FEATURES.CLOUD_SYNC, options);
}

/**
 * Check access to crew management features
 */
export function useCrewFeatures(options?: UsePremiumFeatureOptions) {
  return usePremiumFeature(PREMIUM_FEATURES.CREW_MANAGEMENT, options);
}

/**
 * Check access to weight tracking features
 */
export function useWeightTracking(options?: UsePremiumFeatureOptions) {
  return usePremiumFeature(PREMIUM_FEATURES.GEAR_WEIGHT, options);
}

/**
 * Check access to live predictions
 */
export function useLivePredictions(options?: UsePremiumFeatureOptions) {
  return usePremiumFeature(PREMIUM_FEATURES.LIVE_PREDICTIONS, options);
}

/**
 * Check access to total moving weight calculator
 */
export function useTotalMovingWeight(options?: UsePremiumFeatureOptions) {
  return usePremiumFeature(PREMIUM_FEATURES.TOTAL_MOVING_WEIGHT, options);
}

// =============================================================================
// Exports
// =============================================================================

export { PREMIUM_FEATURES };
export type { UsePremiumFeatureOptions, UsePremiumFeatureResult, PremiumFeature };
