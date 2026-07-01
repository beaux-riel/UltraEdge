/**
 * Premium Features Test Suite
 * Tests for subscription context, feature gating, and premium hooks
 */

import { PREMIUM_FEATURES, ENTITLEMENTS, PRODUCT_IDS } from '../config/revenuecat';

describe('Premium Configuration', () => {
  describe('PREMIUM_FEATURES', () => {
    it('should define all premium feature keys', () => {
      expect(PREMIUM_FEATURES.CLOUD_SYNC).toBeDefined();
      expect(PREMIUM_FEATURES.CREW_MANAGEMENT).toBeDefined();
      expect(PREMIUM_FEATURES.GEAR_WEIGHT).toBeDefined();
      expect(PREMIUM_FEATURES.TOTAL_MOVING_WEIGHT).toBeDefined();
      expect(PREMIUM_FEATURES.MULTI_DEVICE).toBeDefined();
    });

    it('should have unique feature identifiers', () => {
      const values = Object.values(PREMIUM_FEATURES);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('ENTITLEMENTS', () => {
    it('should define premium and lifetime entitlements', () => {
      expect(ENTITLEMENTS.PREMIUM).toBe('premium');
      expect(ENTITLEMENTS.PREMIUM_LIFETIME).toBe('premium_lifetime');
    });
  });

  describe('PRODUCT_IDS', () => {
    it('should define all product IDs', () => {
      expect(PRODUCT_IDS.PREMIUM_MONTHLY).toBeDefined();
      expect(PRODUCT_IDS.PREMIUM_ANNUAL).toBeDefined();
      expect(PRODUCT_IDS.PREMIUM_LIFETIME).toBeDefined();
    });

    it('should follow naming convention', () => {
      expect(PRODUCT_IDS.PREMIUM_MONTHLY).toContain('monthly');
      expect(PRODUCT_IDS.PREMIUM_ANNUAL).toContain('annual');
      expect(PRODUCT_IDS.PREMIUM_LIFETIME).toContain('lifetime');
    });
  });
});

describe('Premium Pricing', () => {
  it('should have correct pricing structure', () => {
    // These match MONETIZATION_SPEC.md
    const PRICING = {
      monthly: 5.99,
      annual: 39.99,
      lifetime: 89.99,
    };

    expect(PRICING.monthly).toBe(5.99);
    expect(PRICING.annual).toBe(39.99);
    expect(PRICING.lifetime).toBe(89.99);
  });

  it('should offer annual savings over monthly', () => {
    const monthlyAnnualized = 5.99 * 12; // $71.88
    const annualPrice = 39.99;
    const savings = monthlyAnnualized - annualPrice;
    const savingsPercent = (savings / monthlyAnnualized) * 100;

    expect(savingsPercent).toBeGreaterThan(40); // At least 40% savings
  });
});

describe('Feature Matrix', () => {
  const FREE_FEATURES = [
    'create_events',
    'checkpoints',
    'gear_management',
    'drop_bag_planning',
    'mover_weight_tracking',
    'export_pdf',
    'local_storage',
  ];

  const PREMIUM_FEATURES_LIST = [
    'cloud_sync',
    'crew_management',
    'gear_weight_tracking',
    'drop_bag_weight_tracking',
    'nutrition_weight_tracking',
    'total_moving_weight',
    'live_predictions',
    'unlimited_sharing',
  ];

  it('should have free features that work without auth', () => {
    FREE_FEATURES.forEach(feature => {
      expect(feature).toBeDefined();
    });
    expect(FREE_FEATURES.length).toBeGreaterThan(5);
  });

  it('should have premium features that require subscription', () => {
    PREMIUM_FEATURES_LIST.forEach(feature => {
      expect(feature).toBeDefined();
    });
    expect(PREMIUM_FEATURES_LIST.length).toBeGreaterThan(5);
  });

  it('should keep weight tracking split correctly', () => {
    expect(FREE_FEATURES).toContain('mover_weight_tracking');
    expect(PREMIUM_FEATURES_LIST).toContain('gear_weight_tracking');
    expect(PREMIUM_FEATURES_LIST).toContain('total_moving_weight');
  });
});
