-- Migration: 001_user_subscriptions
-- Description: User subscription state synced from RevenueCat webhooks
-- Created: 2026-02-02

-- Subscription entitlement enum
CREATE TYPE subscription_entitlement AS ENUM ('free', 'premium', 'premium_lifetime');

-- Platform enum for purchase source
CREATE TYPE purchase_platform AS ENUM ('ios', 'android', 'web', 'stripe');

-- RevenueCat event types for audit logging
CREATE TYPE revenuecat_event_type AS ENUM (
  'INITIAL_PURCHASE',
  'RENEWAL',
  'CANCELLATION',
  'UNCANCELLATION',
  'EXPIRATION',
  'BILLING_ISSUE',
  'PRODUCT_CHANGE',
  'TRANSFER',
  'REFUND',
  'SUBSCRIPTION_PAUSED',
  'SUBSCRIPTION_EXTENDED'
);

-- Main subscription table
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- RevenueCat identifiers
  rc_customer_id TEXT UNIQUE NOT NULL,
  rc_original_app_user_id TEXT,
  
  -- Current entitlement state
  entitlement subscription_entitlement NOT NULL DEFAULT 'free',
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  -- Subscription details
  product_id TEXT,
  purchase_date TIMESTAMPTZ,
  original_purchase_date TIMESTAMPTZ,
  expiration_date TIMESTAMPTZ,
  
  -- Renewal state
  will_renew BOOLEAN DEFAULT false,
  is_in_billing_retry BOOLEAN DEFAULT false,
  billing_issue_detected_at TIMESTAMPTZ,
  
  -- Trial info
  is_trial BOOLEAN DEFAULT false,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  
  -- Cancellation info
  unsubscribe_detected_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Platform and store info
  platform purchase_platform,
  store TEXT, -- 'app_store', 'play_store', 'stripe', etc.
  store_transaction_id TEXT,
  
  -- Price info (for analytics)
  price_in_cents INTEGER,
  currency TEXT,
  
  -- Last event received
  last_event_type revenuecat_event_type,
  last_event_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_rc_customer_id ON user_subscriptions(rc_customer_id);
CREATE INDEX idx_user_subscriptions_is_active ON user_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_subscriptions_expiration ON user_subscriptions(expiration_date) WHERE expiration_date IS NOT NULL;

-- Subscription event log (audit trail of all RevenueCat events)
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Event data
  event_type revenuecat_event_type NOT NULL,
  product_id TEXT,
  
  -- Raw event payload for debugging
  raw_payload JSONB,
  
  -- Timestamps
  event_timestamp TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_timestamp ON subscription_events(event_timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Helper function to check if a user has premium access
CREATE OR REPLACE FUNCTION has_premium_access(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_subscriptions
    WHERE user_id = check_user_id
      AND is_active = true
      AND (
        entitlement = 'premium_lifetime'
        OR (entitlement = 'premium' AND expiration_date > NOW())
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE user_subscriptions IS 'User subscription state synced from RevenueCat webhooks';
COMMENT ON TABLE subscription_events IS 'Audit log of all RevenueCat webhook events';
COMMENT ON FUNCTION has_premium_access IS 'Check if a user currently has premium access';
