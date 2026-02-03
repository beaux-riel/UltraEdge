/**
 * SubscriptionContext
 * 
 * Manages subscription state, entitlement checks, and purchase functions
 * using RevenueCat SDK. Supports both authenticated and anonymous users.
 * 
 * Key features:
 * - Initializes RevenueCat on app start
 * - Links RevenueCat customer ID to Supabase user ID when authenticated
 * - Supports anonymous users (RevenueCat generates anonymous ID)
 * - Provides purchase and restore functions
 * - Handles all three subscription types: monthly, annual, lifetime
 */

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Platform, Alert, AppState, AppStateStatus } from 'react-native';
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesOffering,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
} from 'react-native-purchases';

import {
  getRevenueCatApiKey,
  ENTITLEMENTS,
  PACKAGE_TYPES,
  PACKAGE_IDENTIFIERS,
  SDK_CONFIG,
  SubscriptionTier,
  PremiumFeature,
  PREMIUM_FEATURES,
} from '../config/revenuecat';

// =============================================================================
// Types
// =============================================================================

interface SubscriptionDetails {
  isActive: boolean;
  expirationDate: Date | null;
  productIdentifier: string | null;
  isTrial: boolean;
  willRenew: boolean;
  isLifetime: boolean;
}

interface SubscriptionState {
  /** Whether RevenueCat SDK has been initialized */
  isInitialized: boolean;
  /** Whether subscription data is loading */
  isLoading: boolean;
  /** Whether a purchase is in progress */
  isPurchasing: boolean;
  /** Current subscription tier */
  tier: SubscriptionTier;
  /** Whether user has premium access (any type) */
  isPremium: boolean;
  /** Whether user has lifetime premium */
  isLifetime: boolean;
  /** Detailed subscription information */
  subscriptionDetails: SubscriptionDetails | null;
  /** RevenueCat customer info */
  customerInfo: CustomerInfo | null;
  /** Available offerings from RevenueCat */
  offerings: PurchasesOfferings | null;
  /** Current (default) offering */
  currentOffering: PurchasesOffering | null;
}

interface SubscriptionContextValue extends SubscriptionState {
  /** Check if user has premium access */
  checkPremiumStatus: () => Promise<boolean>;
  /** Purchase a specific package */
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  /** Restore previous purchases (required by App Store) */
  restorePurchases: () => Promise<boolean>;
  /** Refresh customer info from RevenueCat */
  refreshCustomerInfo: () => Promise<CustomerInfo | null>;
  /** Get the monthly subscription package */
  getMonthlyPackage: () => PurchasesPackage | null;
  /** Get the annual subscription package */
  getAnnualPackage: () => PurchasesPackage | null;
  /** Get the lifetime purchase package */
  getLifetimePackage: () => PurchasesPackage | null;
  /** Check if a specific premium feature is accessible */
  hasFeatureAccess: (feature: PremiumFeature) => boolean;
  /** Login with user ID (links to Supabase) */
  loginWithUserId: (userId: string) => Promise<void>;
  /** Logout (switch to anonymous) */
  logout: () => Promise<void>;
}

// =============================================================================
// Context
// =============================================================================

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface SubscriptionProviderProps {
  children: ReactNode;
  /** Optional: Supabase user ID to link RevenueCat customer */
  userId?: string | null;
}

export function SubscriptionProvider({ children, userId }: SubscriptionProviderProps) {
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);

  // ==========================================================================
  // Derived State
  // ==========================================================================

  const subscriptionDetails = useMemo((): SubscriptionDetails | null => {
    if (!customerInfo) return null;

    const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
    const lifetimeEntitlement = customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM_LIFETIME];
    
    const activeEntitlement = lifetimeEntitlement || premiumEntitlement;
    
    if (!activeEntitlement) {
      return {
        isActive: false,
        expirationDate: null,
        productIdentifier: null,
        isTrial: false,
        willRenew: false,
        isLifetime: false,
      };
    }

    return {
      isActive: true,
      expirationDate: activeEntitlement.expirationDate 
        ? new Date(activeEntitlement.expirationDate) 
        : null,
      productIdentifier: activeEntitlement.productIdentifier,
      isTrial: activeEntitlement.periodType === 'TRIAL',
      willRenew: activeEntitlement.willRenew,
      isLifetime: !!lifetimeEntitlement || !activeEntitlement.expirationDate,
    };
  }, [customerInfo]);

  const isPremium = useMemo(() => {
    return subscriptionDetails?.isActive ?? false;
  }, [subscriptionDetails]);

  const isLifetime = useMemo(() => {
    return subscriptionDetails?.isLifetime ?? false;
  }, [subscriptionDetails]);

  const tier = useMemo((): SubscriptionTier => {
    if (isLifetime) return 'premium_lifetime';
    if (isPremium) return 'premium';
    return 'free';
  }, [isPremium, isLifetime]);

  const currentOffering = useMemo(() => {
    return offerings?.current ?? null;
  }, [offerings]);

  // ==========================================================================
  // SDK Initialization
  // ==========================================================================

  const initializeRevenueCat = useCallback(async (appUserId?: string | null) => {
    try {
      // Enable debug logging in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      const apiKey = getRevenueCatApiKey();
      
      // Configure SDK
      // Note: If appUserId is null/undefined, RevenueCat creates an anonymous ID
      await Purchases.configure({
        apiKey,
        appUserID: appUserId ?? undefined,
      });

      console.log('[Subscription] RevenueCat initialized', appUserId ? `for user: ${appUserId}` : 'anonymously');
      setIsInitialized(true);

      // Fetch initial data
      await Promise.all([
        fetchOfferings(),
        refreshCustomerInfo(),
      ]);
    } catch (error) {
      console.error('[Subscription] Failed to initialize RevenueCat:', error);
      // Still mark as initialized so UI doesn't hang
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeRevenueCat(userId);
  }, []);

  // Handle user ID changes (login/logout from Supabase)
  useEffect(() => {
    if (!isInitialized) return;

    const handleUserChange = async () => {
      if (userId) {
        await loginWithUserId(userId);
      } else {
        await logout();
      }
    };

    handleUserChange();
  }, [userId, isInitialized]);

  // Refresh on app foreground
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active' && isInitialized) {
        refreshCustomerInfo();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isInitialized]);

  // ==========================================================================
  // Data Fetching
  // ==========================================================================

  const fetchOfferings = useCallback(async (): Promise<PurchasesOfferings | null> => {
    try {
      const fetchedOfferings = await Purchases.getOfferings();
      setOfferings(fetchedOfferings);
      
      if (!fetchedOfferings.current) {
        console.warn('[Subscription] No current offering configured in RevenueCat');
      }
      
      return fetchedOfferings;
    } catch (error) {
      console.error('[Subscription] Failed to fetch offerings:', error);
      return null;
    }
  }, []);

  const refreshCustomerInfo = useCallback(async (): Promise<CustomerInfo | null> => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      return info;
    } catch (error) {
      console.error('[Subscription] Failed to refresh customer info:', error);
      return null;
    }
  }, []);

  // ==========================================================================
  // Premium Status
  // ==========================================================================

  const checkPremiumStatus = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      const hasPremium = 
        info.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined ||
        info.entitlements.active[ENTITLEMENTS.PREMIUM_LIFETIME] !== undefined;
      
      return hasPremium;
    } catch (error) {
      console.error('[Subscription] Failed to check premium status:', error);
      return false;
    }
  }, []);

  const hasFeatureAccess = useCallback((feature: PremiumFeature): boolean => {
    // All premium features require premium access
    return isPremium;
  }, [isPremium]);

  // ==========================================================================
  // Package Helpers
  // ==========================================================================

  const getMonthlyPackage = useCallback((): PurchasesPackage | null => {
    if (!currentOffering) return null;
    return currentOffering.availablePackages.find(
      pkg => pkg.packageType === PACKAGE_TYPES.MONTHLY || pkg.identifier === PACKAGE_IDENTIFIERS.MONTHLY
    ) ?? null;
  }, [currentOffering]);

  const getAnnualPackage = useCallback((): PurchasesPackage | null => {
    if (!currentOffering) return null;
    return currentOffering.availablePackages.find(
      pkg => pkg.packageType === PACKAGE_TYPES.ANNUAL || pkg.identifier === PACKAGE_IDENTIFIERS.ANNUAL
    ) ?? null;
  }, [currentOffering]);

  const getLifetimePackage = useCallback((): PurchasesPackage | null => {
    if (!currentOffering) return null;
    return currentOffering.availablePackages.find(
      pkg => pkg.packageType === PACKAGE_TYPES.LIFETIME || pkg.identifier === PACKAGE_IDENTIFIERS.LIFETIME
    ) ?? null;
  }, [currentOffering]);

  // ==========================================================================
  // Purchase Functions
  // ==========================================================================

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!isInitialized) {
      Alert.alert(
        'Not Ready',
        'The payment system is still initializing. Please try again in a moment.'
      );
      return false;
    }

    setIsPurchasing(true);

    try {
      const { customerInfo: newInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(newInfo);

      // Check if purchase granted premium access
      const hasPremium = 
        newInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined ||
        newInfo.entitlements.active[ENTITLEMENTS.PREMIUM_LIFETIME] !== undefined;

      if (hasPremium) {
        Alert.alert(
          'Welcome to Premium! 🎉',
          'Thank you for subscribing. You now have access to all premium features.'
        );
        return true;
      }

      return false;
    } catch (error) {
      const purchaseError = error as PurchasesError;
      
      // User cancelled - not an error
      if (purchaseError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        console.log('[Subscription] Purchase cancelled by user');
        return false;
      }

      // Handle specific errors
      let errorMessage = 'There was an error processing your purchase. Please try again.';
      
      if (purchaseError.code === PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR) {
        errorMessage = 'Your purchase is pending approval. You\'ll get access once it\'s confirmed.';
      } else if (purchaseError.code === PURCHASES_ERROR_CODE.PRODUCT_ALREADY_PURCHASED_ERROR) {
        errorMessage = 'You already have an active subscription. Try restoring your purchases.';
      } else if (purchaseError.code === PURCHASES_ERROR_CODE.STORE_PROBLEM_ERROR) {
        errorMessage = 'There\'s a problem with the app store. Please try again later.';
      } else if (purchaseError.code === PURCHASES_ERROR_CODE.NETWORK_ERROR) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      Alert.alert('Purchase Error', errorMessage);
      console.error('[Subscription] Purchase failed:', purchaseError);
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [isInitialized]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!isInitialized) {
      Alert.alert(
        'Not Ready',
        'The payment system is still initializing. Please try again in a moment.'
      );
      return false;
    }

    setIsLoading(true);

    try {
      const restoredInfo = await Purchases.restorePurchases();
      setCustomerInfo(restoredInfo);

      // Check if restore found premium access
      const hasPremium = 
        restoredInfo.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined ||
        restoredInfo.entitlements.active[ENTITLEMENTS.PREMIUM_LIFETIME] !== undefined;

      if (hasPremium) {
        Alert.alert(
          'Purchases Restored',
          'Your premium subscription has been restored successfully!'
        );
        return true;
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any active subscriptions associated with your account. ' +
          'If you believe this is an error, please contact support.'
        );
        return false;
      }
    } catch (error) {
      const purchaseError = error as PurchasesError;
      console.error('[Subscription] Restore failed:', purchaseError);
      
      Alert.alert(
        'Restore Error',
        'There was an error restoring your purchases. Please try again or contact support.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // ==========================================================================
  // User Management
  // ==========================================================================

  const loginWithUserId = useCallback(async (newUserId: string): Promise<void> => {
    if (!isInitialized) return;

    try {
      const { customerInfo: newInfo } = await Purchases.logIn(newUserId);
      setCustomerInfo(newInfo);
      console.log('[Subscription] Logged in with user ID:', newUserId);
    } catch (error) {
      console.error('[Subscription] Failed to login:', error);
    }
  }, [isInitialized]);

  const logout = useCallback(async (): Promise<void> => {
    if (!isInitialized) return;

    try {
      const newInfo = await Purchases.logOut();
      setCustomerInfo(newInfo);
      console.log('[Subscription] Logged out to anonymous user');
    } catch (error) {
      // logOut throws if already anonymous - that's fine
      console.log('[Subscription] Logout (already anonymous or error):', error);
    }
  }, [isInitialized]);

  // ==========================================================================
  // Context Value
  // ==========================================================================

  const value = useMemo((): SubscriptionContextValue => ({
    // State
    isInitialized,
    isLoading,
    isPurchasing,
    tier,
    isPremium,
    isLifetime,
    subscriptionDetails,
    customerInfo,
    offerings,
    currentOffering,
    // Functions
    checkPremiumStatus,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    getMonthlyPackage,
    getAnnualPackage,
    getLifetimePackage,
    hasFeatureAccess,
    loginWithUserId,
    logout,
  }), [
    isInitialized,
    isLoading,
    isPurchasing,
    tier,
    isPremium,
    isLifetime,
    subscriptionDetails,
    customerInfo,
    offerings,
    currentOffering,
    checkPremiumStatus,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    getMonthlyPackage,
    getAnnualPackage,
    getLifetimePackage,
    hasFeatureAccess,
    loginWithUserId,
    logout,
  ]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access subscription state and functions.
 * 
 * @example
 * ```tsx
 * const { isPremium, purchasePackage, getMonthlyPackage } = useSubscription();
 * 
 * if (!isPremium) {
 *   const pkg = getMonthlyPackage();
 *   if (pkg) await purchasePackage(pkg);
 * }
 * ```
 */
export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
}

// =============================================================================
// Exports
// =============================================================================

export type {
  SubscriptionState,
  SubscriptionDetails,
  SubscriptionContextValue,
};
