/**
 * UltraEdge Context Providers
 * Export all context providers and hooks
 */

// Auth (optional - for cloud sync & premium features)
export { AuthProvider, useAuth } from './AuthContext';
export type { AuthState, AuthContextType, AuthResult } from './AuthContext';

// Event management
export { EventProvider, useEvents } from './EventContext';

// Subscription & Premium features (RevenueCat)
export { 
  SubscriptionProvider, 
  useSubscription,
  type SubscriptionState,
  type SubscriptionDetails,
  type SubscriptionContextValue,
} from './SubscriptionContext';

// Re-export other contexts that exist
// Note: Add more exports here as contexts are used/needed
