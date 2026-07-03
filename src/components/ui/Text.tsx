/**
 * UltraEdge Text Component
 * Typography-aware text with theme colors
 */

import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { TypographyStyle } from '../../theme/typography';

interface TextProps extends RNTextProps {
  variant?: TypographyStyle;
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'success' | 'warning' | 'error';
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

export function Text({
  variant = 'body',
  color = 'primary',
  align = 'left',
  style,
  children,
  ...props
}: TextProps) {
  const { theme } = useTheme();
  const { typography, colors } = theme;

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return colors.bark;
      case 'secondary':
        return colors.stone;
      case 'tertiary':
        return colors.mist;
      case 'inverse':
        return colors.snow;
      case 'success':
        return colors.meadow;
      case 'warning':
        return colors.sunset;
      case 'error':
        return colors.clay;
      default:
        return colors.bark;
    }
  };

  const typographyStyle = typography[variant];

  const combinedStyle: TextStyle = {
    ...typographyStyle,
    color: getColor(),
    textAlign: align,
  };

  return (
    <RNText style={[combinedStyle, style]} {...props}>
      {children}
    </RNText>
  );
}

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

export function H1(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h1" {...props} />;
}

export function H2(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h2" {...props} />;
}

export function H3(props: Omit<TextProps, 'variant'>) {
  return <Text variant="h3" {...props} />;
}

export function Body(props: Omit<TextProps, 'variant'>) {
  return <Text variant="body" {...props} />;
}

export function BodySmall(props: Omit<TextProps, 'variant'>) {
  return <Text variant="bodySmall" {...props} />;
}

export function Caption(props: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" color="tertiary" {...props} />;
}

export function Label(props: Omit<TextProps, 'variant'>) {
  return <Text variant="label" color="secondary" {...props} />;
}

export default Text;
