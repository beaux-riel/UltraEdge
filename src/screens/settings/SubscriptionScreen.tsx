/**
 * SubscriptionScreen
 * Manage subscription, view status, restore purchases
 */

import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { Card } from '../../components/ui/Card';
import {
  PremiumBadge,
  RestorePurchasesButton,
  UpgradeBottomSheet,
  UpgradeBottomSheetRef,
  PricingTier,
} from '../../components/premium';

// TODO: Import from actual SubscriptionContext when available
// import { useSubscription } from '../../context/SubscriptionContext';

// Mock subscription state for development
interface MockSubscriptionState {
  isPremium: boolean;
  tier: 'free' | 'premium' | 'premium_lifetime';
  productId: string | null;
  expirationDate: Date | null;
  willRenew: boolean;
  platform: 'ios' | 'android' | 'web' | null;
}

// Toggle this to test different states
const MOCK_STATE: MockSubscriptionState = {
  isPremium: false,
  tier: 'free',
  productId: null,
  expirationDate: null,
  willRenew: false,
  platform: null,
};

// Feature list for premium comparison
const PREMIUM_FEATURES = [
  {
    icon: 'cloud-outline' as const,
    title: 'Cloud Sync',
    description: 'Access your events on all devices',
    free: false,
    premium: true,
  },
  {
    icon: 'people-outline' as const,
    title: 'Crew Features',
    description: 'Invite crew, assign tasks, send notifications',
    free: false,
    premium: true,
  },
  {
    icon: 'scale-outline' as const,
    title: 'Weight Tracking',
    description: 'Gear weights, pack analysis, checkpoint breakdown',
    free: false,
    premium: true,
  },
  {
    icon: 'analytics-outline' as const,
    title: 'Race Day Intelligence',
    description: 'Live ETA predictions and pace analysis',
    free: false,
    premium: true,
  },
  {
    icon: 'share-social-outline' as const,
    title: 'Unlimited Sharing',
    description: 'Share all events with anyone',
    free: false,
    premium: true,
  },
  {
    icon: 'create-outline' as const,
    title: 'Event Planning',
    description: 'Create unlimited events with checkpoints',
    free: true,
    premium: true,
  },
  {
    icon: 'document-text-outline' as const,
    title: 'PDF Export',
    description: 'Export detailed race plans',
    free: true,
    premium: true,
  },
];

export function SubscriptionScreen() {
  const { theme, isDarkMode } = useTheme();
  const { colors, typography, radius, spacing, shadows } = theme;
  const insets = useSafeAreaInsets();
  const upgradeSheetRef = useRef<UpgradeBottomSheetRef>(null);
  
  const [refreshing, setRefreshing] = useState(false);
  const [subscriptionState, setSubscriptionState] = useState<MockSubscriptionState>(MOCK_STATE);

  // TODO: Use actual subscription context
  // const { isPremium, tier, expirationDate, ... } = useSubscription();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Refresh subscription status from RevenueCat
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleUpgradePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    upgradeSheetRef.current?.open();
  };

  const handlePurchase = async (tier: PricingTier): Promise<boolean> => {
    // TODO: Implement actual purchase via RevenueCat
    console.log(`[SubscriptionScreen] Purchase requested: ${tier}`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock success
    setSubscriptionState({
      isPremium: true,
      tier: tier === 'lifetime' ? 'premium_lifetime' : 'premium',
      productId: `com.ultraedge.${tier}`,
      expirationDate: tier === 'lifetime' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      willRenew: tier !== 'lifetime',
      platform: Platform.OS as 'ios' | 'android',
    });
    
    return true;
  };

  const handleRestore = async (): Promise<boolean> => {
    // TODO: Implement actual restore via RevenueCat
    console.log('[SubscriptionScreen] Restore requested');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return false;
  };

  const handleManageSubscription = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (Platform.OS === 'ios') {
      Linking.openURL('itms-apps://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      Platform.OS === 'ios'
        ? 'To cancel your subscription, go to Settings > Apple ID > Subscriptions on your device.'
        : 'To cancel your subscription, go to Play Store > Subscriptions.',
      [
        { text: 'Not Now', style: 'cancel' },
        { 
          text: 'Go to Settings', 
          onPress: handleManageSubscription 
        },
      ]
    );
  };

  const formatExpirationDate = (date: Date | null) => {
    if (!date) return 'Never expires';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'Premium';
      case 'premium_lifetime':
        return 'Premium Lifetime';
      default:
        return 'Free';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.parchment }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.forest}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Current Status Card */}
        <Card
          variant={subscriptionState.isPremium ? 'hero' : 'elevated'}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            <View style={styles.statusBadgeContainer}>
              {subscriptionState.isPremium ? (
                <PremiumBadge size="lg" variant="filled" label="PRO" />
              ) : (
                <View
                  style={[
                    styles.freeBadge,
                    {
                      backgroundColor: colors.cream,
                      borderRadius: radius.full,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.freeBadgeText,
                      {
                        color: colors.stone,
                        fontFamily: typography.label.fontFamily,
                        fontSize: typography.label.fontSize,
                      },
                    ]}
                  >
                    FREE
                  </Text>
                </View>
              )}
            </View>
            
            <Text
              style={[
                styles.statusTitle,
                {
                  color: subscriptionState.isPremium ? '#FFFFFF' : colors.bark,
                  fontFamily: typography.h2.fontFamily,
                  fontSize: typography.h2.fontSize,
                },
              ]}
            >
              {getTierDisplayName(subscriptionState.tier)}
            </Text>

            {subscriptionState.isPremium && subscriptionState.expirationDate && (
              <Text
                style={[
                  styles.statusSubtitle,
                  {
                    color: subscriptionState.isPremium ? 'rgba(255,255,255,0.8)' : colors.stone,
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
              >
                {subscriptionState.willRenew ? 'Renews' : 'Expires'}: {formatExpirationDate(subscriptionState.expirationDate)}
              </Text>
            )}

            {subscriptionState.isPremium && subscriptionState.tier === 'premium_lifetime' && (
              <Text
                style={[
                  styles.statusSubtitle,
                  {
                    color: 'rgba(255,255,255,0.8)',
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
              >
                ✨ Lifetime access — thank you for your support!
              </Text>
            )}
          </View>

          {!subscriptionState.isPremium && (
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
              <Ionicons name="star" size={18} color="#FFFFFF" />
              <Text
                style={[
                  styles.upgradeButtonText,
                  {
                    fontFamily: typography.label.fontFamily,
                    fontSize: 14,
                  },
                ]}
              >
                Upgrade to Premium
              </Text>
            </TouchableOpacity>
          )}

          {subscriptionState.isPremium && subscriptionState.tier !== 'premium_lifetime' && (
            <View style={styles.manageButtons}>
              <TouchableOpacity
                onPress={handleManageSubscription}
                style={[
                  styles.manageButton,
                  {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Ionicons name="settings-outline" size={16} color="#FFFFFF" />
                <Text style={styles.manageButtonText}>Manage</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelSubscription}
                style={[
                  styles.manageButton,
                  {
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderRadius: radius.sm,
                  },
                ]}
              >
                <Text style={[styles.manageButtonText, { opacity: 0.8 }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        {/* Features Comparison */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.bark,
                fontFamily: typography.h3.fontFamily,
                fontSize: typography.h3.fontSize,
              },
            ]}
          >
            What's Included
          </Text>

          <View style={styles.featuresGrid}>
            {PREMIUM_FEATURES.map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureItem,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.borderLight,
                  },
                ]}
              >
                <View style={styles.featureContent}>
                  <View
                    style={[
                      styles.featureIcon,
                      {
                        backgroundColor: feature.premium && !feature.free
                          ? (isDarkMode ? 'rgba(255, 155, 108, 0.15)' : 'rgba(224, 123, 76, 0.1)')
                          : colors.cream,
                      },
                    ]}
                  >
                    <Ionicons
                      name={feature.icon}
                      size={18}
                      color={feature.premium && !feature.free ? colors.sunrise : colors.forest}
                    />
                  </View>
                  <View style={styles.featureText}>
                    <Text
                      style={[
                        styles.featureTitle,
                        {
                          color: colors.bark,
                          fontFamily: typography.body.fontFamily,
                          fontSize: typography.body.fontSize,
                        },
                      ]}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      style={[
                        styles.featureDescription,
                        {
                          color: colors.stone,
                          fontFamily: typography.bodySmall.fontFamily,
                          fontSize: typography.bodySmall.fontSize,
                        },
                      ]}
                    >
                      {feature.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.featureIndicators}>
                  {/* Free indicator */}
                  <View style={styles.indicatorColumn}>
                    {feature.free ? (
                      <Ionicons name="checkmark-circle" size={18} color={colors.meadow} />
                    ) : (
                      <Ionicons name="close-circle" size={18} color={colors.mist} />
                    )}
                  </View>
                  {/* Premium indicator */}
                  <View style={styles.indicatorColumn}>
                    <Ionicons name="checkmark-circle" size={18} color={colors.sunrise} />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: colors.mist },
                ]}
              />
              <Text
                style={[
                  styles.legendText,
                  {
                    color: colors.stone,
                    fontFamily: typography.caption.fontFamily,
                    fontSize: typography.caption.fontSize,
                  },
                ]}
              >
                Free
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: colors.sunrise },
                ]}
              />
              <Text
                style={[
                  styles.legendText,
                  {
                    color: colors.stone,
                    fontFamily: typography.caption.fontFamily,
                    fontSize: typography.caption.fontSize,
                  },
                ]}
              >
                Premium
              </Text>
            </View>
          </View>
        </View>

        {/* Restore Section */}
        <View style={styles.section}>
          <Card variant="standard" style={styles.restoreCard}>
            <View style={styles.restoreContent}>
              <View style={styles.restoreTextContainer}>
                <Text
                  style={[
                    styles.restoreTitle,
                    {
                      color: colors.bark,
                      fontFamily: typography.body.fontFamily,
                      fontSize: typography.body.fontSize,
                    },
                  ]}
                >
                  Already a subscriber?
                </Text>
                <Text
                  style={[
                    styles.restoreDescription,
                    {
                      color: colors.stone,
                      fontFamily: typography.bodySmall.fontFamily,
                      fontSize: typography.bodySmall.fontSize,
                    },
                  ]}
                >
                  If you've purchased before, restore your purchases to unlock premium features.
                </Text>
              </View>
              <RestorePurchasesButton
                onRestore={handleRestore}
                variant="outlined"
              />
            </View>
          </Card>
        </View>

        {/* Support Links */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: colors.bark,
                fontFamily: typography.h3.fontFamily,
                fontSize: typography.h3.fontSize,
              },
            ]}
          >
            Support
          </Text>

          <Card variant="standard">
            <TouchableOpacity
              style={styles.supportItem}
              onPress={() => Linking.openURL('mailto:support@ultraedge.app')}
            >
              <Ionicons name="mail-outline" size={20} color={colors.trail} />
              <Text
                style={[
                  styles.supportItemText,
                  {
                    color: colors.bark,
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
              >
                Contact Support
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mist} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <TouchableOpacity
              style={styles.supportItem}
              onPress={() => Linking.openURL('https://ultraedge.app/help')}
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.trail} />
              <Text
                style={[
                  styles.supportItemText,
                  {
                    color: colors.bark,
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
              >
                FAQs
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mist} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <TouchableOpacity
              style={styles.supportItem}
              onPress={() => Linking.openURL('https://ultraedge.app/terms')}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.trail} />
              <Text
                style={[
                  styles.supportItemText,
                  {
                    color: colors.bark,
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
              >
                Terms of Service
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mist} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

            <TouchableOpacity
              style={styles.supportItem}
              onPress={() => Linking.openURL('https://ultraedge.app/privacy')}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.trail} />
              <Text
                style={[
                  styles.supportItemText,
                  {
                    color: colors.bark,
                    fontFamily: typography.body.fontFamily,
                    fontSize: typography.body.fontSize,
                  },
                ]}
              >
                Privacy Policy
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.mist} />
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>

      {/* Upgrade Bottom Sheet */}
      <UpgradeBottomSheet
        ref={upgradeSheetRef}
        onPurchase={handlePurchase}
        onRestore={handleRestore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 24,
  },
  statusCard: {
    // Additional styling handled by Card component
  },
  statusHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadgeContainer: {
    marginBottom: 12,
  },
  freeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  freeBadgeText: {
    fontWeight: '700',
  },
  statusTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtitle: {
    textAlign: 'center',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  manageButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  manageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  manageButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  featuresGrid: {
    gap: 8,
  },
  featureItem: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featureContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '500',
  },
  featureDescription: {
    marginTop: 2,
  },
  featureIndicators: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 8,
  },
  indicatorColumn: {
    width: 24,
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  restoreCard: {
    // Additional styling handled by Card component
  },
  restoreContent: {
    gap: 16,
  },
  restoreTextContainer: {
    gap: 4,
  },
  restoreTitle: {
    fontWeight: '500',
  },
  restoreDescription: {
    lineHeight: 18,
  },
  supportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  supportItemText: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: 32,
  },
});

export default SubscriptionScreen;
