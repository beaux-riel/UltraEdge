/**
 * UltraEdge Sign In Screen
 * Email + social sign-in options
 * 
 * Supports:
 * - Email/password
 * - Apple Sign-In (iOS only)
 * - Google Sign-In
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';

import { useTheme } from '../../theme';
import { Text, H1, H2, Body, BodySmall, Caption, Button, Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SignInScreen({ navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const insets = useSafeAreaInsets();
  
  const { signInWithEmail, signInWithApple, signInWithGoogle, resetPassword } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Email sign in
  const handleEmailSignIn = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert('Sign In Failed', result.error || 'Please check your credentials');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Apple sign in
  const handleAppleSignIn = async () => {
    setSocialLoading('apple');
    try {
      const result = await signInWithApple();
      
      if (result.success) {
        navigation.goBack();
      } else if (result.error !== 'Sign-in was cancelled') {
        Alert.alert('Sign In Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Apple Sign-In failed');
    } finally {
      setSocialLoading(null);
    }
  };

  // Google sign in
  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        navigation.goBack();
      } else if (result.error !== 'Sign-in was cancelled') {
        Alert.alert('Sign In Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Google Sign-In failed');
    } finally {
      setSocialLoading(null);
    }
  };

  // Forgot password
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        Alert.alert(
          'Password Reset Email Sent',
          'Check your inbox for a link to reset your password'
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send reset email');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || socialLoading !== null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.parchment }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={isDarkMode 
            ? [colors.forest, colors.parchment] 
            : [colors.forest, colors.forestSoft, colors.parchment]
          }
          style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        >
          {/* Back button */}
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.snow} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Ionicons name="trail-sign-outline" size={48} color={colors.snow} style={{ marginBottom: spacing.sm }} />
            <H1 style={{ color: colors.snow }}>Welcome Back</H1>
            <BodySmall style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              Sign in to sync your data across devices
            </BodySmall>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={[styles.content, { marginTop: -spacing.xl }]}>
          <Card variant="elevated" style={styles.formCard}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Caption style={{ marginBottom: 6 }}>EMAIL</Caption>
              <View style={[
                styles.inputWrapper,
                { 
                  borderColor: errors.email ? colors.clay : colors.border,
                  backgroundColor: colors.surface,
                }
              ]}>
                <Ionicons name="mail-outline" size={20} color={colors.stone} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    { 
                      fontFamily: typography.body.fontFamily,
                      color: colors.bark,
                    }
                  ]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.mist}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isFormDisabled}
                />
              </View>
              {errors.email && (
                <BodySmall style={{ color: colors.clay, marginTop: 4 }}>
                  {errors.email}
                </BodySmall>
              )}
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, { marginTop: spacing.md }]}>
              <Caption style={{ marginBottom: 6 }}>PASSWORD</Caption>
              <View style={[
                styles.inputWrapper,
                { 
                  borderColor: errors.password ? colors.clay : colors.border,
                  backgroundColor: colors.surface,
                }
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.stone} style={styles.inputIcon} />
                <TextInput
                  style={[
                    styles.input,
                    { 
                      fontFamily: typography.body.fontFamily,
                      color: colors.bark,
                      flex: 1,
                    }
                  ]}
                  placeholder="Enter password"
                  placeholderTextColor={colors.mist}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password"
                  editable={!isFormDisabled}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  disabled={isFormDisabled}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.stone}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && (
                <BodySmall style={{ color: colors.clay, marginTop: 4 }}>
                  {errors.password}
                </BodySmall>
              )}
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={isFormDisabled}
            >
              <BodySmall style={{ color: colors.forest }}>
                Forgot password?
              </BodySmall>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              onPress={handleEmailSignIn}
              loading={isLoading}
              disabled={isFormDisabled}
              fullWidth
              style={{ marginTop: spacing.lg }}
            >
              Sign In
            </Button>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Caption style={{ marginHorizontal: spacing.md, color: colors.stone }}>
                or continue with
              </Caption>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            {/* Social Sign In Buttons */}
            <View style={styles.socialButtons}>
              {/* Apple Sign In (iOS only) */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { 
                      backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={handleAppleSignIn}
                  disabled={isFormDisabled}
                >
                  {socialLoading === 'apple' ? (
                    <ActivityIndicator color={isDarkMode ? '#000000' : '#FFFFFF'} />
                  ) : (
                    <>
                      <Ionicons
                        name="logo-apple"
                        size={22}
                        color={isDarkMode ? '#000000' : '#FFFFFF'}
                      />
                      <Body style={[
                        styles.socialButtonText,
                        { color: isDarkMode ? '#000000' : '#FFFFFF' }
                      ]}>
                        Apple
                      </Body>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Google Sign In */}
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1.5,
                  }
                ]}
                onPress={handleGoogleSignIn}
                disabled={isFormDisabled}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator color={colors.bark} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={20} color="#4285F4" />
                    <Body style={[styles.socialButtonText, { color: colors.bark }]}>
                      Google
                    </Body>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Card>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Body color="secondary">Don't have an account? </Body>
            <TouchableOpacity
              onPress={() => navigation.replace('SignUp')}
              disabled={isFormDisabled}
            >
              <Body style={{ color: colors.forest, fontWeight: '600' }}>
                Sign Up
              </Body>
            </TouchableOpacity>
          </View>

          {/* Skip / Use Without Account */}
          <TouchableOpacity
            style={styles.skipContainer}
            onPress={() => navigation.goBack()}
            disabled={isFormDisabled}
          >
            <BodySmall color="tertiary">
              Continue without signing in →
            </BodySmall>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
  },
  formCard: {
    padding: 24,
  },
  inputContainer: {},
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    padding: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 26,
    gap: 8,
  },
  socialButtonText: {
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  skipContainer: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
});
