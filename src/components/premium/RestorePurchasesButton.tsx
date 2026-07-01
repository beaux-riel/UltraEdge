/**
 * RestorePurchasesButton Component
 * Button to restore previous purchases (required by App Store)
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../theme/ThemeProvider';

type RestoreState = 'idle' | 'loading' | 'success' | 'error';

interface RestorePurchasesButtonProps {
  onRestore: () => Promise<boolean>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  variant?: 'text' | 'outlined';
  style?: ViewStyle;
}

export function RestorePurchasesButton({
  onRestore,
  onSuccess,
  onError,
  variant = 'text',
  style,
}: RestorePurchasesButtonProps) {
  const { theme } = useTheme();
  const { colors, typography, radius } = theme;
  const [state, setState] = useState<RestoreState>('idle');

  const handlePress = async () => {
    if (state === 'loading') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setState('loading');

    try {
      const restored = await onRestore();
      if (restored) {
        setState('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess?.();
        // Reset to idle after showing success
        setTimeout(() => setState('idle'), 2000);
      } else {
        setState('idle');
        // No purchases to restore is not an error, just return to idle
      }
    } catch (error) {
      setState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onError?.(error as Error);
      // Reset to idle after showing error
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const getContent = () => {
    switch (state) {
      case 'loading':
        return (
          <>
            <ActivityIndicator size="small" color={colors.trail} />
            <Text
              style={[
                styles.text,
                {
                  color: colors.trail,
                  fontFamily: typography.body.fontFamily,
                  marginLeft: 8,
                },
              ]}
            >
              Restoring...
            </Text>
          </>
        );
      case 'success':
        return (
          <>
            <Ionicons name="checkmark-circle" size={18} color={colors.meadow} />
            <Text
              style={[
                styles.text,
                {
                  color: colors.meadow,
                  fontFamily: typography.body.fontFamily,
                  marginLeft: 6,
                },
              ]}
            >
              Purchases Restored!
            </Text>
          </>
        );
      case 'error':
        return (
          <>
            <Ionicons name="alert-circle" size={18} color={colors.clay} />
            <Text
              style={[
                styles.text,
                {
                  color: colors.clay,
                  fontFamily: typography.body.fontFamily,
                  marginLeft: 6,
                },
              ]}
            >
              Restore Failed
            </Text>
          </>
        );
      default:
        return (
          <>
            <Ionicons name="refresh-outline" size={18} color={colors.trail} />
            <Text
              style={[
                styles.text,
                {
                  color: colors.trail,
                  fontFamily: typography.body.fontFamily,
                  marginLeft: 6,
                },
              ]}
            >
              Restore Purchases
            </Text>
          </>
        );
    }
  };

  const containerStyle: ViewStyle = variant === 'outlined'
    ? {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        paddingVertical: 12,
        paddingHorizontal: 16,
      }
    : {
        paddingVertical: 8,
      };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={state === 'loading'}
      activeOpacity={0.7}
      style={[styles.container, containerStyle, style]}
    >
      {getContent()}
    </TouchableOpacity>
  );
}

// Compact version for inline use
export function RestoreLink({
  onRestore,
  onSuccess,
  onError,
  style,
}: Omit<RestorePurchasesButtonProps, 'variant'>) {
  const { theme } = useTheme();
  const { colors, typography } = theme;
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    if (isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      const restored = await onRestore();
      if (restored) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess?.();
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      activeOpacity={0.7}
      style={[styles.link, style]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.mist} />
      ) : (
        <Text
          style={[
            styles.linkText,
            {
              color: colors.mist,
              fontFamily: typography.bodySmall.fontFamily,
              fontSize: typography.bodySmall.fontSize,
            },
          ]}
        >
          Restore Purchases
        </Text>
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
  text: {
    fontSize: 15,
  },
  link: {
    padding: 4,
  },
  linkText: {
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});

export default RestorePurchasesButton;
