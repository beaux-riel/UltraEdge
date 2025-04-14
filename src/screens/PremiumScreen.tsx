import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Button, Card, Divider, useTheme as usePaperTheme, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../context/ThemeContext';
import { useSupabase } from '../context/SupabaseContext';
import { useRevenueCat } from '../context/RevenueCatContext';
import { Ionicons } from '@expo/vector-icons';

const PremiumScreen = ({ navigation }) => {
  const paperTheme = usePaperTheme();
  const { isDarkMode, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user, isPremium } = useSupabase();
  const { 
    loading, 
    purchaseInProgress,
    currentOffering, 
    activeSubscription,
    getMonthlyPackage, 
    getAnnualPackage, 
    purchasePackage,
    restorePurchases,
    formatPrice
  } = useRevenueCat();
  
  const [selectedPackage, setSelectedPackage] = useState('annual'); // 'monthly' or 'annual'
  
  // Get packages
  const monthlyPackage = getMonthlyPackage();
  const annualPackage = getAnnualPackage();
  
  // Format prices
  const monthlyPrice = monthlyPackage ? formatPrice(monthlyPackage.product.priceString, 'month') : '';
  const annualPrice = annualPackage ? formatPrice(annualPackage.product.priceString, 'year') : '';
  
  // Calculate savings for annual plan
  const calculateSavings = () => {
    if (!monthlyPackage || !annualPackage) return null;
    
    const monthlyPriceValue = monthlyPackage.product.price;
    const annualPriceValue = annualPackage.product.price;
    
    // Calculate annual cost if paying monthly
    const annualCostIfPayingMonthly = monthlyPriceValue * 12;
    
    // Calculate savings
    const savingsAmount = annualCostIfPayingMonthly - annualPriceValue;
    const savingsPercentage = Math.round((savingsAmount / annualCostIfPayingMonthly) * 100);
    
    return {
      amount: savingsAmount,
      percentage: savingsPercentage,
      formattedAmount: `${annualPackage.product.currencyCode} ${savingsAmount.toFixed(2)}`,
    };
  };
  
  const savings = calculateSavings();
  
  // Handle purchase
  const handlePurchase = async () => {
    if (!user) {
      navigation.navigate('Settings'); // Navigate to settings to sign in
      return;
    }
    
    const packageToPurchase = selectedPackage === 'monthly' ? monthlyPackage : annualPackage;
    
    if (packageToPurchase) {
      await purchasePackage(packageToPurchase);
    }
  };
  
  // Handle restore purchases
  const handleRestorePurchases = async () => {
    await restorePurchases();
  };
  
  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: isDarkMode ? theme.colors.background : '#f5f5f5',
    },
    headerContainer: {
      backgroundColor: theme.colors.primary,
      paddingTop: insets.top > 0 ? insets.top : 16,
      paddingBottom: 24,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#ffffff',
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: '#ffffff',
      opacity: 0.9,
      textAlign: 'center',
    },
    card: {
      marginHorizontal: 16,
      marginTop: -20,
      marginBottom: 16,
      borderRadius: 8,
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
    },
    packageCard: {
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 8,
      borderWidth: 2,
      backgroundColor: isDarkMode ? theme.colors.surface : '#ffffff',
    },
    selectedPackageCard: {
      borderColor: theme.colors.primary,
    },
    unselectedPackageCard: {
      borderColor: isDarkMode ? '#333333' : '#e0e0e0',
    },
    packageTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    packagePrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginVertical: 8,
    },
    packageDescription: {
      fontSize: 14,
      color: isDarkMode ? '#e0e0e0' : '#757575',
      marginBottom: 8,
    },
    savingsBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderTopRightRadius: 8,
      borderBottomLeftRadius: 8,
    },
    savingsText: {
      color: '#ffffff',
      fontWeight: 'bold',
      fontSize: 12,
    },
    featureTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 16,
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    featureIcon: {
      marginRight: 12,
      color: theme.colors.primary,
    },
    featureText: {
      fontSize: 16,
      flex: 1,
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    divider: {
      marginVertical: 16,
      backgroundColor: isDarkMode ? '#333333' : '#e0e0e0',
    },
    purchaseButton: {
      marginHorizontal: 16,
      marginBottom: 16,
      paddingVertical: 8,
    },
    restoreButton: {
      marginHorizontal: 16,
      marginBottom: insets.bottom + 16,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    premiumContainer: {
      padding: 24,
      alignItems: 'center',
    },
    premiumIcon: {
      fontSize: 64,
      color: theme.colors.primary,
      marginBottom: 16,
    },
    premiumTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      color: isDarkMode ? '#ffffff' : '#000000',
      textAlign: 'center',
    },
    premiumText: {
      fontSize: 16,
      marginBottom: 24,
      color: isDarkMode ? '#e0e0e0' : '#757575',
      textAlign: 'center',
    },
  };
  
  // Show loading state
  if (loading) {
    return (
      <View style={[dynamicStyles.container, dynamicStyles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={dynamicStyles.loadingText}>Loading subscription options...</Text>
      </View>
    );
  }
  
  // Show premium status if user is already premium
  if (isPremium || activeSubscription) {
    return (
      <ScrollView 
        style={dynamicStyles.container}
        contentContainerStyle={{
          paddingTop: insets.top > 0 ? insets.top : 16,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <View style={dynamicStyles.premiumContainer}>
          <Ionicons name="star" style={dynamicStyles.premiumIcon} />
          <Text style={dynamicStyles.premiumTitle}>You're a Premium Member!</Text>
          <Text style={dynamicStyles.premiumText}>
            Thank you for your support. You have access to all premium features including cloud backup, 
            advanced analytics, and unlimited race plans.
          </Text>
          
          {activeSubscription && (
            <Text style={dynamicStyles.premiumText}>
              Your subscription is active until{' '}
              {new Date(activeSubscription.expirationDate).toLocaleDateString()}
            </Text>
          )}
          
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={dynamicStyles.purchaseButton}
          >
            Continue
          </Button>
        </View>
      </ScrollView>
    );
  }
  
  return (
    <ScrollView 
      style={dynamicStyles.container}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 16,
      }}
    >
      {/* Header */}
      <View style={dynamicStyles.headerContainer}>
        <Text style={dynamicStyles.headerTitle}>Upgrade to Premium</Text>
        <Text style={dynamicStyles.headerSubtitle}>
          Unlock advanced features to take your ultra running to the next level
        </Text>
      </View>
      
      {/* Features Card */}
      <Card style={dynamicStyles.card}>
        <Card.Content>
          <Text style={dynamicStyles.featureTitle}>Premium Features</Text>
          
          <View style={dynamicStyles.featureRow}>
            <Ionicons name="cloud-upload-outline" size={24} style={dynamicStyles.featureIcon} />
            <Text style={dynamicStyles.featureText}>
              Cloud backup and sync across all your devices
            </Text>
          </View>
          
          <View style={dynamicStyles.featureRow}>
            <Ionicons name="analytics-outline" size={24} style={dynamicStyles.featureIcon} />
            <Text style={dynamicStyles.featureText}>
              Advanced analytics and performance insights
            </Text>
          </View>
          
          <View style={dynamicStyles.featureRow}>
            <Ionicons name="infinite-outline" size={24} style={dynamicStyles.featureIcon} />
            <Text style={dynamicStyles.featureText}>
              Unlimited race plans and aid station configurations
            </Text>
          </View>
          
          <View style={dynamicStyles.featureRow}>
            <Ionicons name="people-outline" size={24} style={dynamicStyles.featureIcon} />
            <Text style={dynamicStyles.featureText}>
              Advanced crew management and coordination tools
            </Text>
          </View>
          
          <View style={dynamicStyles.featureRow}>
            <Ionicons name="notifications-outline" size={24} style={dynamicStyles.featureIcon} />
            <Text style={dynamicStyles.featureText}>
              Race day notifications and real-time updates
            </Text>
          </View>
        </Card.Content>
      </Card>
      
      {/* Subscription Options */}
      {currentOffering ? (
        <>
          {/* Monthly Package */}
          {monthlyPackage && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedPackage('monthly')}
            >
              <Card 
                style={[
                  dynamicStyles.packageCard,
                  selectedPackage === 'monthly' 
                    ? dynamicStyles.selectedPackageCard 
                    : dynamicStyles.unselectedPackageCard
                ]}
              >
                <Card.Content>
                  <Text style={dynamicStyles.packageTitle}>Monthly Premium</Text>
                  <Text style={dynamicStyles.packagePrice}>{monthlyPrice}</Text>
                  <Text style={dynamicStyles.packageDescription}>
                    Full access to all premium features
                  </Text>
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
          
          {/* Annual Package */}
          {annualPackage && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedPackage('annual')}
            >
              <Card 
                style={[
                  dynamicStyles.packageCard,
                  selectedPackage === 'annual' 
                    ? dynamicStyles.selectedPackageCard 
                    : dynamicStyles.unselectedPackageCard
                ]}
              >
                {savings && savings.percentage > 0 && (
                  <View style={dynamicStyles.savingsBadge}>
                    <Text style={dynamicStyles.savingsText}>Save {savings.percentage}%</Text>
                  </View>
                )}
                <Card.Content>
                  <Text style={dynamicStyles.packageTitle}>Annual Premium</Text>
                  <Text style={dynamicStyles.packagePrice}>{annualPrice}</Text>
                  <Text style={dynamicStyles.packageDescription}>
                    Full access to all premium features
                  </Text>
                  {savings && (
                    <Text style={[dynamicStyles.packageDescription, { color: theme.colors.primary }]}>
                      Save {savings.formattedAmount} compared to monthly
                    </Text>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          )}
          
          {/* Purchase Button */}
          <Button
            mode="contained"
            onPress={handlePurchase}
            style={dynamicStyles.purchaseButton}
            loading={purchaseInProgress}
            disabled={purchaseInProgress}
          >
            {purchaseInProgress ? 'Processing...' : 'Subscribe Now'}
          </Button>
          
          {/* Restore Purchases Button */}
          <Button
            mode="outlined"
            onPress={handleRestorePurchases}
            style={dynamicStyles.restoreButton}
            disabled={purchaseInProgress}
          >
            Restore Purchases
          </Button>
        </>
      ) : (
        <View style={dynamicStyles.loadingContainer}>
          <Text style={dynamicStyles.loadingText}>
            Subscription options are currently unavailable. Please try again later.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default PremiumScreen;