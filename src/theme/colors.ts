/**
 * UltraEdge Color System
 * Aesthetic C: Warm/Organic — Trail-Focused & Approachable
 */

export const colors = {
  // ============================================================================
  // LIGHT MODE
  // ============================================================================
  light: {
    // Primary Colors
    forest: '#2D5A3D',      // Primary actions, headers, active states
    trail: '#8B6F47',       // Secondary actions, accents, icons
    sunrise: '#E07B4C',     // Highlights, notifications, CTAs

    // Background Colors
    parchment: '#FAF7F2',   // Primary background
    cream: '#F5F0E6',       // Card backgrounds
    birch: '#EDE6D9',       // Elevated surfaces, section dividers

    // Text Colors
    bark: '#2C2416',        // Primary text
    stone: '#6B5D4D',       // Secondary text, labels
    mist: '#9A8E7F',        // Tertiary text, placeholders

    // Semantic Colors
    meadow: '#5A9A6B',      // Success states
    sunset: '#D4763B',      // Warning states
    clay: '#C45B4A',        // Error states, destructive actions
    sky: '#5B8FA8',         // Info states, links

    // Surface Colors
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    border: '#E5DED3',
    borderLight: '#F0EBE3',

    // Shadows (for StyleSheet)
    shadow: 'rgba(44, 36, 22, 0.08)',
    shadowMedium: 'rgba(44, 36, 22, 0.12)',
    shadowHeavy: 'rgba(44, 36, 22, 0.16)',
  },

  // ============================================================================
  // DARK MODE
  // ============================================================================
  dark: {
    // Primary Colors (lightened for dark backgrounds)
    forest: '#4A8B5C',      // +15% lightness
    trail: '#B8956A',       // +15% lightness
    sunrise: '#FF9B6C',     // +10% lightness for pop

    // Background Colors (warm blacks)
    parchment: '#0F0D0B',   // Ember Black - primary background
    cream: '#1A1714',       // Charred - card backgrounds
    birch: '#252019',       // Bark Dark - elevated surfaces

    // Text Colors
    bark: '#F5F0E6',        // Primary text (inverted cream)
    stone: '#B8A99A',       // Secondary text
    mist: '#7A6F63',        // Tertiary text, placeholders

    // Semantic Colors (adjusted for dark)
    meadow: '#6BB87A',      // Success - slightly brighter
    sunset: '#E8924D',      // Warning - slightly brighter
    clay: '#E07366',        // Error - slightly brighter
    sky: '#7BB5CC',         // Info - slightly brighter

    // Surface Colors
    surface: '#1A1714',
    surfaceElevated: '#252019',
    border: '#3D352C',
    borderLight: '#2D261F',

    // Glows (replace shadows in dark mode)
    shadow: 'rgba(255, 155, 108, 0.05)',   // Subtle sunrise glow
    shadowMedium: 'rgba(255, 155, 108, 0.08)',
    shadowHeavy: 'rgba(255, 155, 108, 0.12)',
  },

  // ============================================================================
  // WEIGHT THRESHOLDS (same in both modes)
  // ============================================================================
  weight: {
    safe: '#5A9A6B',        // 0-70% of target (meadow)
    caution: '#E07B4C',     // 70-90% of target (sunrise)
    danger: '#C45B4A',      // 90%+ of target (clay)
    over: '#B03A2E',        // Over target (darker clay)
  },

  // ============================================================================
  // GEAR CATEGORIES
  // ============================================================================
  categories: {
    footwear: '#8B6F47',    // Trail brown
    clothing: '#5B8FA8',    // Sky blue
    pack: '#2D5A3D',        // Forest green
    hydration: '#5B8FA8',   // Sky blue
    lighting: '#E07B4C',    // Sunrise orange
    navigation: '#6B5D4D',  // Stone
    safety: '#C45B4A',      // Clay red
    poles: '#8B6F47',       // Trail brown
    nutrition: '#5A9A6B',   // Meadow green
    other: '#9A8E7F',       // Mist gray
  },
} as const;

export type ColorScheme = { [K in keyof typeof colors.light]: string };
export type ThemeMode = 'light' | 'dark' | 'system';
