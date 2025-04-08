import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useSupabase } from './SupabaseContext';

// Create context
const RevenueCatContext = createContext();

// RevenueCat API keys
const REVENUECAT_API_KEYS = {
  ios: 'appl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your iOS API key
  android: 'goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Replace with your Android API key
};

// Offering identifiers
const OFFERING_IDENTIFIER = 'premium_subscription';
const MONTHLY_PRODUCT_IDENTIFIER = 'premium_monthly';
const ANNUAL_PRODUCT_IDENTIFIER = 'premium_annual';

export const RevenueCatProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [currentOffering, setCurrentOffering] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);
  const [activeSubscription, setActiveSubscription] = useState(null);
  
  const { user, supabase, isPremium, upgradeToPremium } = useSupabase();

  // Initialize RevenueCat
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        // Select API key based on platform
        const apiKey = Platform.OS === 'ios' 
          ? REVENUECAT_API_KEYS.ios 
          : REVENUECAT_API_KEYS.android;
        
        // Configure RevenueCat
        await Purchases.configure({
          apiKey,
          appUserID: user?.id, // Use Supabase user ID for RevenueCat user ID
          observerMode: false, // Set to true if you want to use another payment system alongside RevenueCat
          useAmazon: false, // Set to true if you're distributing through Amazon Appstore
        });
        
        console.log('RevenueCat initialized successfully');
        setIsInitialized(true);
        
        // Get offerings
        await fetchOfferings();
        
        // Get customer info
        await refreshCustomerInfo();
      } catch (error) {
        console.error('Error initializing RevenueCat:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      initRevenueCat();
    } else {
      setLoading(false);
    }
    
    // Clean up
    return () => {
      // No cleanup needed for RevenueCat
    };
  }, [user]);
  
  // Fetch offerings
  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      setOfferings(offerings);
      
      // Set current offering
      if (offerings.current) {
        setCurrentOffering(offerings.current);
      } else if (offerings.all && offerings.all[OFFERING_IDENTIFIER]) {
        setCurrentOffering(offerings.all[OFFERING_IDENTIFIER]);
      }
      
      return offerings;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  };
  
  // Refresh customer info
  const refreshCustomerInfo = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Check if user has active subscription
      const hasActiveSubscription = checkIfUserHasActiveSubscription(info);
      setActiveSubscription(hasActiveSubscription);
      
      // If user has active subscription but is not marked as premium in Supabase
      if (hasActiveSubscription && !isPremium && user) {
        // Upgrade user to premium in Supabase
        await upgradeToPremium();
      }
      
      return info;
    } catch (error) {
      console.error('Error refreshing customer info:', error);
      return null;
    }
  };
  
  // Check if user has active subscription
  const checkIfUserHasActiveSubscription = (info) => {
    if (!info) return null;
    
    // Check for active subscriptions
    const allPurchasedProductIdentifiers = Object.keys(info.entitlements.active);
    
    if (allPurchasedProductIdentifiers.includes('premium')) {
      // Find the subscription details
      const subscriptionDetails = info.entitlements.active.premium;
      return {
        isActive: true,
        expirationDate: new Date(subscriptionDetails.expirationDate),
        productIdentifier: subscriptionDetails.productIdentifier,
        isTrial: subscriptionDetails.periodType === 'trial',
      };
    }
    
    return null;
  };
  
  // Purchase a package
  const purchasePackage = async (pkg) => {
    if (!isInitialized) {
      Alert.alert('Error', 'Payment system is not initialized yet. Please try again later.');
      return null;
    }
    
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to purchase a subscription.');
      return null;
    }
    
    setPurchaseInProgress(true);
    
    try {
      const { customerInfo, productIdentifier } = await Purchases.purchasePackage(pkg);
      
      // Update customer info
      setCustomerInfo(customerInfo);
      
      // Check if purchase was successful
      const hasActiveSubscription = checkIfUserHasActiveSubscription(customerInfo);
      setActiveSubscription(hasActiveSubscription);
      
      if (hasActiveSubscription) {
        // Upgrade user to premium in Supabase
        await upgradeToPremium();
        
        Alert.alert('Success', 'Thank you for subscribing to Premium!');
      }
      
      return { customerInfo, productIdentifier };
    } catch (error) {
      if (!error.userCancelled) {
        Alert.alert('Error', error.message || 'There was an error processing your purchase.');
      }
      return null;
    } finally {
      setPurchaseInProgress(false);
    }
  };
  
  // Restore purchases
  const restorePurchases = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Payment system is not initialized yet. Please try again later.');
      return null;
    }
    
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to restore your purchases.');
      return null;
    }
    
    setLoading(true);
    
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      // Update customer info
      setCustomerInfo(customerInfo);
      
      // Check if user has active subscription
      const hasActiveSubscription = checkIfUserHasActiveSubscription(customerInfo);
      setActiveSubscription(hasActiveSubscription);
      
      if (hasActiveSubscription && !isPremium) {
        // Upgrade user to premium in Supabase
        await upgradeToPremium();
        
        Alert.alert('Success', 'Your premium subscription has been restored!');
      } else if (!hasActiveSubscription) {
        Alert.alert('No Subscriptions Found', 'We couldn\'t find any active subscriptions associated with your account.');
      }
      
      return customerInfo;
    } catch (error) {
      Alert.alert('Error', error.message || 'There was an error restoring your purchases.');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Get monthly package
  const getMonthlyPackage = () => {
    if (!currentOffering) return null;
    
    return currentOffering.availablePackages.find(
      pkg => pkg.identifier === MONTHLY_PRODUCT_IDENTIFIER || 
             pkg.product.identifier === MONTHLY_PRODUCT_IDENTIFIER
    );
  };
  
  // Get annual package
  const getAnnualPackage = () => {
    if (!currentOffering) return null;
    
    return currentOffering.availablePackages.find(
      pkg => pkg.identifier === ANNUAL_PRODUCT_IDENTIFIER || 
             pkg.product.identifier === ANNUAL_PRODUCT_IDENTIFIER
    );
  };
  
  // Format price
  const formatPrice = (price, period) => {
    if (!price) return '';
    return `${price}${period ? ` / ${period}` : ''}`;
  };
  
  return (
    <RevenueCatContext.Provider
      value={{
        isInitialized,
        offerings,
        currentOffering,
        customerInfo,
        loading,
        purchaseInProgress,
        activeSubscription,
        fetchOfferings,
        refreshCustomerInfo,
        purchasePackage,
        restorePurchases,
        getMonthlyPackage,
        getAnnualPackage,
        formatPrice,
      }}
    >
      {children}
    </RevenueCatContext.Provider>
  );
};

// Custom hook to use the RevenueCat context
export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};