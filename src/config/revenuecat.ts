/**
 * RevenueCat SDK Configuration
 * 
 * This file contains all RevenueCat-related configuration including
 * API keys, product IDs, entitlements, and offering identifiers.
 */

import { Platform } from 'react-native';

// =============================================================================
// API Keys
// =============================================================================

/**
 * RevenueCat API keys for iOS and Android.
 * 
 * IMPORTANT: Replace these placeholder keys with your actual keys from
 * the RevenueCat dashboard: https://app.revenuecat.com
 * 
 * These are PUBLIC API keys (safe to include in app bundle).
 * Never include your RevenueCat secret key in the app.
 */
export const REVENUECAT_API_KEYS = {
  ios: process.env.REVENUECAT_IOS_API_KEY || 'appl_PLACEHOLDER_IOS_KEY',
  android: process.env.REVENUECAT_ANDROID_API_KEY || 'goog_PLACEHOLDER_ANDROID_KEY',
} as const;

/**
 * Get the appropriate API key for the current platform
 */
export const getRevenueCatApiKey = (): string => {
  return Platform.OS === 'ios'
    ? REVENUECAT_API_KEYS.ios
    : REVENUECAT_API_KEYS.android;
};

/**
 * Whether RevenueCat can actually be used in this environment.
 *
 * Returns false when:
 * - Running on web (react-native-purchases has no web support)
 * - The API key env vars are unset (placeholder keys are still in place)
 *
 * Callers MUST treat an unconfigured environment as "not premium" and
 * skip all SDK calls — never crash.
 */
export const isRevenueCatConfigured = (): boolean => {
  if (Platform.OS === 'web') return false;
  const key = getRevenueCatApiKey();
  return !!key && !key.includes('PLACEHOLDER');
};

// =============================================================================
// Entitlements
// =============================================================================

/**
 * Entitlement identifiers as configured in RevenueCat dashboard.
 * 
 * Entitlements represent feature access levels:
 * - 'premium': Standard premium subscription (monthly/annual)
 * - 'premium_lifetime': Lifetime premium access (one-time purchase)
 */
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  PREMIUM_LIFETIME: 'premium_lifetime',
} as const;

export type EntitlementId = typeof ENTITLEMENTS[keyof typeof ENTITLEMENTS];

/**
 * User subscription tier
 */
export type SubscriptionTier = 'free' | 'premium' | 'premium_lifetime';

// =============================================================================
// Product Identifiers
// =============================================================================

/**
 * Product identifiers as configured in App Store Connect / Google Play Console.
 * 
 * These must match exactly what's configured in:
 * - App Store Connect (for iOS)
 * - Google Play Console (for Android)
 * - RevenueCat Products dashboard
 */
export const PRODUCT_IDS = {
  // Subscriptions
  PREMIUM_MONTHLY: 'ultraedge_premium_monthly',
  PREMIUM_ANNUAL: 'ultraedge_premium_annual',
  // One-time purchases
  PREMIUM_LIFETIME: 'ultraedge_premium_lifetime',
} as const;

export type ProductId = typeof PRODUCT_IDS[keyof typeof PRODUCT_IDS];

// =============================================================================
// Offerings
// =============================================================================

/**
 * Offering identifier - configured in RevenueCat dashboard.
 * 
 * Offerings allow A/B testing of different pricing/packages.
 * The 'default' offering is used unless you create custom ones.
 */
export const OFFERING_IDENTIFIER = 'default';

/**
 * Package types (RevenueCat PACKAGE_TYPE enum values)
 * These match the SDK's PACKAGE_TYPE enum for comparison
 */
export const PACKAGE_TYPES = {
  MONTHLY: 'MONTHLY',
  ANNUAL: 'ANNUAL',
  LIFETIME: 'LIFETIME',
} as const;

/**
 * Package identifiers (used in RevenueCat dashboard)
 * These are the string identifiers used when configuring packages
 */
export const PACKAGE_IDENTIFIERS = {
  MONTHLY: '$rc_monthly',
  ANNUAL: '$rc_annual',
  LIFETIME: '$rc_lifetime',
} as const;

// =============================================================================
// Pricing Reference
// =============================================================================

/**
 * Reference pricing for documentation purposes.
 * Actual prices are fetched from RevenueCat/stores at runtime.
 * 
 * These are used for:
 * - Fallback display if store data isn't available
 * - Documentation reference
 */
export const REFERENCE_PRICING = {
  [PRODUCT_IDS.PREMIUM_MONTHLY]: {
    price: 5.99,
    currency: 'USD',
    period: 'month',
    displayPrice: '$5.99/mo',
  },
  [PRODUCT_IDS.PREMIUM_ANNUAL]: {
    price: 39.99,
    currency: 'USD',
    period: 'year',
    displayPrice: '$39.99/yr',
    savings: '44%', // Compared to monthly
  },
  [PRODUCT_IDS.PREMIUM_LIFETIME]: {
    price: 89.99,
    currency: 'USD',
    period: null,
    displayPrice: '$89.99 once',
  },
} as const;

// =============================================================================
// Premium Features
// =============================================================================

/**
 * Features that require premium subscription.
 * Used by `usePremiumFeature` hook to check access.
 */
export const PREMIUM_FEATURES = {
  // Cloud & Sync
  CLOUD_SYNC: 'cloud_sync',
  AUTOMATIC_BACKUP: 'automatic_backup',
  MULTI_DEVICE: 'multi_device',
  
  // Weight Tracking
  GEAR_WEIGHT: 'gear_weight',
  DROP_BAG_WEIGHT: 'drop_bag_weight',
  NUTRITION_WEIGHT: 'nutrition_weight',
  TOTAL_MOVING_WEIGHT: 'total_moving_weight',
  WEIGHT_PER_CHECKPOINT: 'weight_per_checkpoint',
  
  // Crew
  CREW_MANAGEMENT: 'crew_management',
  CREW_APP_ACCESS: 'crew_app_access',
  CREW_NOTIFICATIONS: 'crew_notifications',
  
  // Sharing
  UNLIMITED_SHARING: 'unlimited_sharing',
  
  // Race Day
  LIVE_PREDICTIONS: 'live_predictions',
  PACE_ANALYSIS: 'pace_analysis',
  HISTORICAL_COMPARISON: 'historical_comparison',
} as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[keyof typeof PREMIUM_FEATURES];

// =============================================================================
// SDK Configuration
// =============================================================================

/**
 * RevenueCat SDK configuration options
 */
export const SDK_CONFIG = {
  /**
   * Observer mode - set to true if using another payment system alongside RevenueCat
   */
  observerMode: false,
  
  /**
   * Use Amazon Appstore - set to true if distributing through Amazon
   */
  useAmazon: false,
  
  /**
   * Verification mode for entitlements (SDK v8+)
   * - 'disabled': No verification (not recommended)
   * - 'informational': Log verification failures but grant access
   * - 'enforced': Deny access on verification failure
   */
  entitlementVerificationMode: 'informational',
} as const;
