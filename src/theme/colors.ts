/** Field guide palette. Legacy token names preserve existing screen compatibility. */
export const colors = {
  light: {
    forest: '#426015', trail: '#4D5960', sunrise: '#426015',
    parchment: '#F3F5F1', cream: '#E9EDE7', birch: '#DDE3DB',
    bark: '#171C20', stone: '#52605F', mist: '#65716D',
    meadow: '#39662D', sunset: '#925414', clay: '#B33A32', sky: '#346477',
    surface: '#FFFFFF', surfaceElevated: '#FFFFFF', border: '#CAD2C9', borderLight: '#DDE3DB',
    snow: '#FFFFFF', forestSoft: '#344A20', sunriseSoft: '#516332',
    accent: '#C3E76B', onAccent: '#171C20', hero: '#171C20', heroText: '#F3F5EF',
    shadow: 'rgba(23,28,32,0.04)', shadowMedium: 'rgba(23,28,32,0.08)', shadowHeavy: 'rgba(23,28,32,0.12)',
  },
  dark: {
    forest: '#C3E76B', trail: '#B4C0BA', sunrise: '#C3E76B',
    parchment: '#111619', cream: '#1B2226', birch: '#252E32',
    bark: '#F3F5EF', stone: '#B5BFBA', mist: '#95A29B',
    meadow: '#A6CF81', sunset: '#E5B46E', clay: '#F58B7F', sky: '#9BC8D8',
    surface: '#1B2226', surfaceElevated: '#252E32', border: '#3B4649', borderLight: '#2F393D',
    snow: '#FFFFFF', forestSoft: '#344A20', sunriseSoft: '#516332',
    accent: '#C3E76B', onAccent: '#171C20', hero: '#171C20', heroText: '#F3F5EF',
    shadow: 'rgba(0,0,0,0.08)', shadowMedium: 'rgba(0,0,0,0.12)', shadowHeavy: 'rgba(0,0,0,0.16)',
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
