/**
 * UltraEdge Sign Up Screen
 * Email registration with optional social sign-up
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

import { useTheme } from '../../theme';
import { Text, H1, H2, Body, BodySmall, Caption, Button, Card } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SignUpScreen({ navigation }: any) {
  const { theme, isDarkMode } = useTheme();
  const { colors, spacing, radius, typography } = theme;
  const insets = useSafeAreaInsets();
  
  const { signUpWithEmail, signInWithApple, signInWithGoogle } = useAuth();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);
  const [errors, setErrors] = useState<{
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Validation
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!displayName.trim()) {
      newErrors.displayName = 'Name is required';
    } else if (displayName.trim().length < 2) {
      newErrors.displayName = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Email sign up
  const handleEmailSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const result = await signUpWithEmail(email, password, displayName.trim());
      
      if (result.success) {
        if (result.needsEmailConfirmation) {
          Alert.alert(
            'Check Your Email',
            'We\'ve sent you a confirmation link. Please check your inbox and click the link to activate your account.',
            [
              {
                text: 'OK',
                onPress: () => navigation.replace('SignIn'),
              },
            ]
          );
        } else {
          navigation.goBack();
        }
      } else {
        Alert.alert('Sign Up Failed', result.error || 'Please try again');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Apple sign up
  const handleAppleSignUp = async () => {
    setSocialLoading('apple');
    try {
      const result = await signInWithApple();
      
      if (result.success) {
        navigation.goBack();
      } else if (result.error !== 'Sign-in was cancelled') {
        Alert.alert('Sign Up Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Apple Sign-In failed');
    } finally {
      setSocialLoading(null);
    }
  };

  // Google sign up
  const handleGoogleSignUp = async () => {
    setSocialLoading('google');
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        navigation.goBack();
      } else if (result.error !== 'Sign-in was cancelled') {
        Alert.alert('Sign Up Failed', result.error);
      }
    } catch (error) {
      Alert.alert('Error', 'Google Sign-In failed');
    } finally {
      setSocialLoading(null);
    }
  };

  const isFormDisabled = isLoading || socialLoading !== null;

  // Input component to reduce repetition
  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options: {
      icon: string;
      placeholder: string;
      error?: string;
      secureTextEntry?: boolean;
      keyboardType?: 'default' | 'email-address';
      autoCapitalize?: 'none' | 'sentences' | 'words';
      autoComplete?: string;
    }
  ) => (
    <View style={styles.inputContainer}>
      <Caption style={{ marginBottom: 6 }}>{label}</Caption>
      <View style={[
        styles.inputWrapper,
        { 
          borderColor: options.error ? colors.clay : colors.border,
          backgroundColor: colors.surface,
        }
      ]}>
        <Ionicons name={options.icon as any} size={20} color={colors.stone} style={styles.inputIcon} />
        <TextInput
          style={[
            styles.input,
            { 
              fontFamily: typography.body.fontFamily,
              color: colors.bark,
              flex: 1,
            }
          ]}
          placeholder={options.placeholder}
          placeholderTextColor={colors.mist}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={options.secureTextEntry && !showPassword}
          keyboardType={options.keyboardType || 'default'}
          autoCapitalize={options.autoCapitalize || 'sentences'}
          autoComplete={options.autoComplete as any}
          editable={!isFormDisabled}
        />
        {options.secureTextEntry && (
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
        )}
      </View>
      {options.error && (
        <BodySmall style={{ color: colors.clay, marginTop: 4 }}>
          {options.error}
        </BodySmall>
      )}
    </View>
  );

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
            <Ionicons name="person-add-outline" size={48} color={colors.snow} style={{ marginBottom: spacing.sm }} />
            <H1 style={{ color: colors.snow }}>Create Account</H1>
            <BodySmall style={{ color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              Join UltraEdge and sync your race plans
            </BodySmall>
          </View>
        </LinearGradient>

        {/* Form */}
        <View style={[styles.content, { marginTop: -spacing.xl }]}>
          <Card variant="elevated" style={styles.formCard}>
            {/* Display Name Input */}
            {renderInput('YOUR NAME', displayName, (text) => {
              setDisplayName(text);
              if (errors.displayName) setErrors({ ...errors, displayName: undefined });
            }, {
              icon: 'person-outline',
              placeholder: 'Trail Runner',
              error: errors.displayName,
              autoCapitalize: 'words',
              autoComplete: 'name',
            })}

            {/* Email Input */}
            <View style={{ marginTop: spacing.md }}>
              {renderInput('EMAIL', email, (text) => {
                setEmail(text);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }, {
                icon: 'mail-outline',
                placeholder: 'your@email.com',
                error: errors.email,
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                autoComplete: 'email',
              })}
            </View>

            {/* Password Input */}
            <View style={{ marginTop: spacing.md }}>
              {renderInput('PASSWORD', password, (text) => {
                setPassword(text);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }, {
                icon: 'lock-closed-outline',
                placeholder: 'At least 6 characters',
                error: errors.password,
                secureTextEntry: true,
                autoCapitalize: 'none',
                autoComplete: 'new-password',
              })}
            </View>

            {/* Confirm Password Input */}
            <View style={{ marginTop: spacing.md }}>
              {renderInput('CONFIRM PASSWORD', confirmPassword, (text) => {
                setConfirmPassword(text);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
              }, {
                icon: 'checkmark-circle-outline',
                placeholder: 'Re-enter password',
                error: errors.confirmPassword,
                secureTextEntry: true,
                autoCapitalize: 'none',
                autoComplete: 'new-password',
              })}
            </View>

            {/* Sign Up Button */}
            <Button
              onPress={handleEmailSignUp}
              loading={isLoading}
              disabled={isFormDisabled}
              fullWidth
              style={{ marginTop: spacing.xl }}
            >
              Create Account
            </Button>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Caption style={{ marginHorizontal: spacing.md, color: colors.stone }}>
                or sign up with
              </Caption>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            {/* Social Sign Up Buttons */}
            <View style={styles.socialButtons}>
              {/* Apple Sign Up (iOS only) */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={[
                    styles.socialButton,
                    { 
                      backgroundColor: isDarkMode ? '#FFFFFF' : '#000000',
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={handleAppleSignUp}
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

              {/* Google Sign Up */}
              <TouchableOpacity
                style={[
                  styles.socialButton,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: 1.5,
                  }
                ]}
                onPress={handleGoogleSignUp}
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

            {/* Terms notice */}
            <BodySmall color="tertiary" align="center" style={{ marginTop: spacing.lg }}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </BodySmall>
          </Card>

          {/* Sign In Link */}
          <View style={styles.signInContainer}>
            <Body color="secondary">Already have an account? </Body>
            <TouchableOpacity
              onPress={() => navigation.replace('SignIn')}
              disabled={isFormDisabled}
            >
              <Body style={{ color: colors.forest, fontWeight: '600' }}>
                Sign In
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
              Continue without an account →
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
    fontSize: 16,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
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
  signInContainer: {
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
