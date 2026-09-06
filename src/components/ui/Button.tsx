/**
 * UltraEdge Button Component
 * Organic design system — rounded, warm, tactile
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  children,
  accessibilityLabel,
  testID,
  variant = 'primary',
  size = 'md',
  onPress,
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const { theme } = useTheme();
  const { colors, typography, shadows } = theme;

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Size configurations
  const sizeConfig = {
    sm: { height: 44, paddingHorizontal: 16, fontSize: 14 },
    md: { height: 48, paddingHorizontal: 24, fontSize: 16 },
    lg: { height: 56, paddingHorizontal: 32, fontSize: 18 },
  };

  // Variant configurations
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: isDisabled ? colors.birch : colors.accent,
            ...shadows.md,
          },
          text: {
            color: colors.onAccent,
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.cream,
            borderWidth: 1.5,
            borderColor: isDisabled ? colors.mist : colors.trail,
          },
          text: {
            color: isDisabled ? colors.mist : colors.trail,
          },
        };
      case 'tertiary':
        return {
          container: {
            backgroundColor: 'transparent',
          },
          text: {
            color: isDisabled ? colors.mist : colors.forest,

          },
        };
      case 'danger':
        return {
          container: {
            backgroundColor: isDisabled ? colors.mist : colors.clay,
            ...shadows.md,
          },
          text: {
            color: colors.snow,
          },
        };
      default:
        return { container: {}, text: {} };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = sizeConfig[size];

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          minHeight: sizeStyles.height,
          paddingVertical: 10,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          borderRadius: 10,
        },
        variantStyles.container,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.text.color}
          size={size === 'sm' ? 'small' : 'small'}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              {
                fontSize: sizeStyles.fontSize,
                fontFamily: typography.label.fontFamily,
                fontWeight: '600' as const,
              },
              variantStyles.text,
              icon ? styles.textWithIcon : null,
              textStyle,
            ]}
          >
            {children}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    textAlign: 'center',
  },
  textWithIcon: {
    marginLeft: 8,
  },
});

export default Button;
