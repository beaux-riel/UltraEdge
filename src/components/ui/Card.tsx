/**
 * UltraEdge Card Component
 * Organic design system — warm surfaces, soft shadows
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

type CardVariant = 'standard' | 'elevated' | 'hero';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
}

export function Card({
  children,
  variant = 'standard',
  onPress,
  style,
  padding,
}: CardProps) {
  const { theme } = useTheme();
  const { colors, radius, layout, shadows } = theme;

  const handlePress = () => {
    if (!onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'standard':
        return {
          backgroundColor: colors.cream,
          borderRadius: radius.md,
          ...shadows.sm,
        };
      case 'elevated':
        return {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          ...shadows.md,
        };
      case 'hero':
        return {
          backgroundColor: colors.forest,
          borderRadius: radius.xl,
          ...shadows.lg,
        };
      default:
        return {};
    }
  };

  const containerStyle: ViewStyle = {
    ...getVariantStyles(),
    padding: padding ?? layout.cardPadding,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.95}
        style={[containerStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
}

// ============================================================================
// CARD SUBCOMPONENTS
// ============================================================================

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.header, { marginBottom: theme.spacing.sm }, style]}>
      {children}
    </View>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.content, style]}>{children}</View>;
}

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  const { theme } = useTheme();
  
  return (
    <View
      style={[
        styles.footer,
        {
          marginTop: theme.spacing.md,
          paddingTop: theme.spacing.md,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderLight,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
});

export default Card;
