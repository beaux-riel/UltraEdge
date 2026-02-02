/**
 * UltraEdge Spacing System
 * Base unit: 4px
 */

export const spacing = {
  xs: 4,    // Icon padding, tight gaps
  sm: 8,    // Inline element spacing
  md: 16,   // Standard component padding
  lg: 24,   // Section spacing
  xl: 32,   // Major section breaks
  '2xl': 48, // Screen-level margins
} as const;

export const radius = {
  xs: 4,    // Small badges
  sm: 8,    // Buttons, inputs
  md: 12,   // Cards
  lg: 16,   // Modals, sheets
  xl: 24,   // Hero cards
  full: 9999, // Pills, circular elements
} as const;

export const layout = {
  // Screen padding
  screenPadding: 20,
  
  // Bottom nav
  bottomNavHeight: 84,
  
  // Safe area defaults (will be overridden by useSafeAreaInsets)
  statusBarHeight: 44,
  homeIndicatorHeight: 34,
  
  // Content widths
  maxContentWidth: 600,
  
  // Touch targets
  minTouchTarget: 44,
  
  // Cards
  cardPadding: 16,
  cardGap: 12,
} as const;

export const shadows = {
  // Light mode shadows
  light: {
    sm: {
      shadowColor: '#2C2416',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#2C2416',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#2C2416',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  // Dark mode glows
  dark: {
    sm: {
      shadowColor: '#FF9B6C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: '#FF9B6C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    lg: {
      shadowColor: '#FF9B6C',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 4,
    },
  },
} as const;

export type SpacingKey = keyof typeof spacing;
export type RadiusKey = keyof typeof radius;
