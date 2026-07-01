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
 * - Reconciles with the `user_subscriptions` table (written by the
 *   RevenueCat webhook) so the database is the source of truth when it
 *   disagrees with the SDK cache. The SDK still provides immediate UX
 *   right after a purchase, before the webhook lands.
 * - Degrades gracefully when RevenueCat keys are not configured or on web:
 *   no SDK calls are made and the user is treated as not premium (unless
 *   the database says otherwise).
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
  isRevenueCatConfigured,
  ENTITLEMENTS,
  PACKAGE_TYPES,
  PACKAGE_IDENTIFIERS,
  SDK_CONFIG,
  SubscriptionTier,
  PremiumFeature,
  PREMIUM_FEATURES,
} from '../config/revenuecat';
import { useAuth, AuthContextType } from './AuthContext';

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

/**
 * Subscription state as recorded server-side in `user_subscriptions`
 * (written by the RevenueCat webhook — see supabase/functions/revenuecat-webhook).
 */
interface ServerSubscriptionStatus {
  isPremium: boolean;
  isLifetime: boolean;
  expirationDate: Date | null;
  productId: string | null;
  willRenew: boolean;
  /** When the server row was last written (webhook receipt time) */
  updatedAt: Date | null;
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
  /** Reconcile local state with the server-side user_subscriptions table */
  syncWithServer: () => Promise<ServerSubscriptionStatus | null>;
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

/**
 * Safe wrapper around useAuth: the SubscriptionProvider is normally nested
 * inside AuthProvider (see App.tsx), but this keeps it usable standalone
 * (e.g. in tests) without crashing.
 */
function useOptionalAuth(): AuthContextType | null {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks -- useAuth always
    // calls useContext before throwing, so hook order is stable.
    return useAuth();
  } catch {
    return null;
  }
}

export function SubscriptionProvider({ children, userId }: SubscriptionProviderProps) {
  // Whether the RevenueCat SDK can be used at all (native platform + real keys).
  // When false we never touch the SDK and rely solely on the server record.
  const rcEnabled = useMemo(() => isRevenueCatConfigured(), []);

  // Auth (supabase client + current user) — used for server reconciliation
  const auth = useOptionalAuth();
  const supabase = auth?.supabase ?? null;
  const effectiveUserId = userId ?? auth?.user?.id ?? null;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerSubscriptionStatus | null>(null);

  // ==========================================================================
  // Derived State
  // ==========================================================================

  /** Subscription details as reported by the RevenueCat SDK cache */
  const sdkDetails = useMemo((): SubscriptionDetails | null => {
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

  /** When the SDK's active entitlement was last purchased (webhook-lag check) */
  const sdkLatestPurchaseDate = useMemo((): Date | null => {
    if (!customerInfo) return null;
    const entitlement =
      customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM_LIFETIME] ||
      customerInfo.entitlements.active[ENTITLEMENTS.PREMIUM];
    return entitlement?.latestPurchaseDate
      ? new Date(entitlement.latestPurchaseDate)
      : null;
  }, [customerInfo]);

  /**
   * Reconciled premium flag.
   *
   * Rules:
   * - No server record (anonymous user, offline, fetch failed): SDK decides.
   * - Server says premium: premium (covers new devices before a restore,
   *   purchases made on another platform, etc.).
   * - Server says NOT premium but the SDK does: only trust the SDK when its
   *   entitlement was purchased AFTER the server row was last written —
   *   i.e. the webhook hasn't landed yet. Otherwise the database wins
   *   (refunds, expirations processed server-side).
   */
  const isPremium = useMemo(() => {
    const sdkPremium = sdkDetails?.isActive ?? false;

    if (!serverStatus) return sdkPremium;
    if (serverStatus.isPremium) return true;

    if (sdkPremium) {
      if (!serverStatus.updatedAt) return true;
      if (sdkLatestPurchaseDate && sdkLatestPurchaseDate > serverStatus.updatedAt) {
        return true; // Fresh purchase; webhook hasn't synced yet
      }
      // DB is source of truth: SDK cache is stale
      return false;
    }

    return false;
  }, [sdkDetails, serverStatus, sdkLatestPurchaseDate]);

  /** Reconciled subscription details (server record wins when SDK is empty/stale) */
  const subscriptionDetails = useMemo((): SubscriptionDetails | null => {
    // If the SDK has an active entitlement and it's what grants access, use it
    if (sdkDetails?.isActive && isPremium) return sdkDetails;

    // Server grants access but SDK doesn't know about it
    if (serverStatus?.isPremium) {
      return {
        isActive: true,
        expirationDate: serverStatus.expirationDate,
        productIdentifier: serverStatus.productId,
        isTrial: false,
        willRenew: serverStatus.willRenew,
        isLifetime: serverStatus.isLifetime,
      };
    }

    if (!sdkDetails && !serverStatus) return null;

    return {
      isActive: false,
      expirationDate: null,
      productIdentifier: null,
      isTrial: false,
      willRenew: false,
      isLifetime: false,
    };
  }, [sdkDetails, serverStatus, isPremium]);

  const isLifetime = useMemo(() => {
    if (!isPremium) return false;
    return (subscriptionDetails?.isLifetime ?? false) || (serverStatus?.isLifetime ?? false);
  }, [isPremium, subscriptionDetails, serverStatus]);

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
    // RevenueCat keys not set (or running on web): skip the SDK entirely.
    // The user is treated as not premium unless the server record says
    // otherwise (see syncWithServer). This must never crash.
    if (!rcEnabled) {
      console.warn(
        '[Subscription] RevenueCat not configured (missing API keys or web platform). ' +
        'Purchases are disabled; premium status will rely on the server record only.'
      );
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }

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
    initializeRevenueCat(effectiveUserId);
  }, []);

  // Handle user ID changes (login/logout from Supabase)
  useEffect(() => {
    if (!isInitialized) return;

    const handleUserChange = async () => {
      if (effectiveUserId) {
        await loginWithUserId(effectiveUserId);
      } else {
        await logout();
      }
      // Re-read the server record for the (possibly new) user
      await syncWithServer();
    };

    handleUserChange();
  }, [effectiveUserId, isInitialized]);

  // Reconcile with the server once the supabase client becomes available
  useEffect(() => {
    if (supabase && effectiveUserId) {
      syncWithServer();
    }
  }, [supabase, effectiveUserId]);

  // Refresh on app foreground
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active' && isInitialized) {
        refreshCustomerInfo();
        syncWithServer();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isInitialized]);

  // ==========================================================================
  // Server Reconciliation (user_subscriptions is the source of truth)
  // ==========================================================================

  /**
   * Fetch the authoritative subscription record from `user_subscriptions`
   * (kept up to date by the revenuecat-webhook edge function) and store it
   * for reconciliation with the SDK cache.
   *
   * Returns the fetched status, or null when unavailable (anonymous user,
   * no supabase client, network error). Never throws.
   */
  const syncWithServer = useCallback(async (): Promise<ServerSubscriptionStatus | null> => {
    if (!supabase || !effectiveUserId) {
      setServerStatus(null);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('entitlement, is_active, expiration_date, product_id, will_renew, updated_at')
        .eq('user_id', effectiveUserId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[Subscription] Failed to fetch server subscription:', error.message);
        // Keep whatever we had; do not clobber a good record on a flaky read
        return null;
      }

      if (!data) {
        // No record yet — user has never purchased (or webhook hasn't fired)
        setServerStatus(null);
        return null;
      }

      const isServerLifetime = data.entitlement === 'premium_lifetime';
      const expirationDate = data.expiration_date ? new Date(data.expiration_date) : null;
      const notExpired = isServerLifetime || !expirationDate || expirationDate > new Date();
      const status: ServerSubscriptionStatus = {
        isPremium: !!data.is_active && data.entitlement !== 'free' && notExpired,
        isLifetime: isServerLifetime,
        expirationDate,
        productId: data.product_id ?? null,
        willRenew: !!data.will_renew,
        updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      };

      setServerStatus(status);
      return status;
    } catch (error) {
      console.error('[Subscription] Server sync failed:', error);
      return null;
    }
  }, [supabase, effectiveUserId]);

  // ==========================================================================
  // Data Fetching
  // ==========================================================================

  const fetchOfferings = useCallback(async (): Promise<PurchasesOfferings | null> => {
    if (!rcEnabled) return null;
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
    if (!rcEnabled) return null;
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
    // Always consult the server record first — it is the source of truth
    const server = await syncWithServer();
    if (server?.isPremium) return true;

    if (!rcEnabled) {
      // No SDK available: server record is all we have
      return server?.isPremium ?? false;
    }

    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      const hasPremium =
        info.entitlements.active[ENTITLEMENTS.PREMIUM] !== undefined ||
        info.entitlements.active[ENTITLEMENTS.PREMIUM_LIFETIME] !== undefined;

      return hasPremium;
    } catch (error) {
      console.error('[Subscription] Failed to check premium status:', error);
      return server?.isPremium ?? false;
    }
  }, [rcEnabled, syncWithServer]);

  const hasFeatureAccess = useCallback((feature: PremiumFeature): boolean => {
    // All premium features currently require premium access. `isPremium` is
    // the reconciled value: server-side user_subscriptions (synced by the
    // RevenueCat webhook) wins over the SDK cache when they disagree.
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
    if (!rcEnabled) {
      Alert.alert(
        'Purchases Unavailable',
        Platform.OS === 'web'
          ? 'Purchases are not available on web. Please use the iOS or Android app to subscribe.'
          : 'Purchases are not available in this build.'
      );
      return false;
    }

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

      // Reconcile with the server record (the webhook may take a moment to
      // land; the SDK result above provides immediate access in the meantime)
      syncWithServer();

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
  }, [rcEnabled, isInitialized, syncWithServer]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!rcEnabled) {
      Alert.alert(
        'Restore Unavailable',
        Platform.OS === 'web'
          ? 'Restoring purchases is not available on web. Please use the iOS or Android app.'
          : 'Restoring purchases is not available in this build.'
      );
      return false;
    }

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

      // Reconcile with the server record after a restore
      syncWithServer();

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
  }, [rcEnabled, isInitialized, syncWithServer]);

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
