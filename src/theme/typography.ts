/**
 * UltraEdge Typography System
 * Primary: Nunito — Rounded, friendly, excellent readability
 * Accent: Playfair Display — For large display numbers only
 * Mono: JetBrains Mono — For numerical data in tables
 */

// Font family names as provided by @expo-google-fonts
export const fonts = {
  primary: {
    regular: 'Nunito_400Regular',
    medium: 'Nunito_500Medium',
    semiBold: 'Nunito_600SemiBold',
    bold: 'Nunito_700Bold',
    extraBold: 'Nunito_800ExtraBold',
  },
  display: {
    regular: 'PlayfairDisplay_400Regular',
    bold: 'PlayfairDisplay_700Bold',
  },
  mono: {
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
  },
} as const;

// System font fallbacks (used before custom fonts load)
export const systemFonts = {
  primary: 'System',
  display: 'Georgia',
  mono: 'Courier New',
} as const;

// Helper to get font with fallback
export function getFont(font: string, fallback: string): string {
  // In production, we'd check if font is loaded
  // For now, return the custom font name (React Native handles fallback)
  return font;
}

export const typography = {
  // Display — Hero numbers, big stats
  display: {
    fontSize: 36,
    fontFamily: fonts.display.bold,
    fontWeight: '700' as const,
    lineHeight: 40, // 1.1
    letterSpacing: -0.72, // -0.02em
  },

  // H1 — Screen titles
  h1: {
    fontSize: 28,
    fontFamily: fonts.primary.bold,
    fontWeight: '700' as const,
    lineHeight: 34, // 1.2
    letterSpacing: -0.28, // -0.01em
  },

  // H2 — Section headers
  h2: {
    fontSize: 22,
    fontFamily: fonts.primary.semiBold,
    fontWeight: '600' as const,
    lineHeight: 28, // 1.25
    letterSpacing: 0,
  },

  // H3 — Card titles, list headers
  h3: {
    fontSize: 18,
    fontFamily: fonts.primary.semiBold,
    fontWeight: '600' as const,
    lineHeight: 24, // 1.3
    letterSpacing: 0,
  },

  // Body Large — Emphasized body text
  bodyLarge: {
    fontSize: 17,
    fontFamily: fonts.primary.regular,
    fontWeight: '400' as const,
    lineHeight: 26, // 1.5
    letterSpacing: 0,
  },

  // Body — Standard body text
  body: {
    fontSize: 15,
    fontFamily: fonts.primary.regular,
    fontWeight: '400' as const,
    lineHeight: 23, // 1.5
    letterSpacing: 0,
  },

  // Body Small — Secondary content
  bodySmall: {
    fontSize: 13,
    fontFamily: fonts.primary.regular,
    fontWeight: '400' as const,
    lineHeight: 18, // 1.4
    letterSpacing: 0.13, // 0.01em
  },

  // Caption — Timestamps, metadata
  caption: {
    fontSize: 11,
    fontFamily: fonts.primary.medium,
    fontWeight: '500' as const,
    lineHeight: 14, // 1.3
    letterSpacing: 0.22, // 0.02em
  },

  // Label — Form labels, button text
  label: {
    fontSize: 12,
    fontFamily: fonts.primary.semiBold,
    fontWeight: '600' as const,
    lineHeight: 14, // 1.2
    letterSpacing: 0.6, // 0.05em
    textTransform: 'uppercase' as const,
  },

  // Mono — Numerical data, weight values
  mono: {
    fontSize: 14,
    fontFamily: fonts.mono.medium,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },

  // Weight Display — Big weight numbers
  weightDisplay: {
    fontSize: 32,
    fontFamily: fonts.display.bold,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },

  // Weight Badge — Inline weight values
  weightBadge: {
    fontSize: 12,
    fontFamily: fonts.mono.medium,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0,
  },
} as const;

export type TypographyStyle = keyof typeof typography;
