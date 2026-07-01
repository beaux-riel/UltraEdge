/**
 * UltraEdge Auth Context
 * Handles authentication state with Supabase
 * 
 * Supports:
 * - Email/password auth
 * - Apple Sign-In (required for App Store)
 * - Google Sign-In
 * 
 * Auth is OPTIONAL — the app works fully without signing in.
 * Auth is only required for premium features (cloud sync, crew, etc.)
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';
import { createSecureStorageAdapter } from '../lib/supabase';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { makeRedirectUri } from 'expo-auth-session';

// Complete web browser auth session for Google Sign-In
WebBrowser.maybeCompleteAuthSession();

// ============================================================================
// TYPES
// ============================================================================

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  // Email auth
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  
  // Social auth
  signInWithApple: () => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  
  // Session management
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Utilities
  supabase: SupabaseClient | null;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  needsEmailConfirmation?: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

// Supabase credentials from environment variables. Expo SDK 52 loads .env
// files automatically and inlines EXPO_PUBLIC_* vars at build time.
// No hardcoded fallbacks — fail loudly if misconfigured.
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in your .env file (see .env.example), then restart the Expo dev server.'
  );
}

// Google OAuth config (configure in Supabase dashboard)
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

// ============================================================================
// DEEP LINK / TOKEN VALIDATION
// ============================================================================

/**
 * Validate that a string is shaped like a JWT (three base64url segments)
 * before it is passed to setSession. Never trust raw deep-link params.
 */
function isValidJwt(token: string | null | undefined): token is string {
  return (
    typeof token === 'string' &&
    token.length >= 20 &&
    token.length <= 4096 &&
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)
  );
}

/**
 * Validate an opaque refresh token (not a JWT): bounded length, safe charset.
 */
function isValidRefreshToken(token: string | null | undefined): token is string {
  return (
    typeof token === 'string' &&
    token.length >= 8 &&
    token.length <= 512 &&
    /^[A-Za-z0-9._-]+$/.test(token)
  );
}

/**
 * Parse auth params from a deep-link URL. Supabase returns tokens in the
 * hash fragment; some flows use the query string. Returns null for
 * unparseable URLs.
 */
function parseAuthParamsFromUrl(url: string): URLSearchParams | null {
  try {
    const parsed = new URL(url);
    const fragment = parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash;
    const params = new URLSearchParams(fragment);
    // Merge query-string params without letting them override fragment params
    parsed.searchParams.forEach((value, key) => {
      if (!params.has(key)) {
        params.set(key, value);
      }
    });
    return params;
  } catch {
    return null;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  // Google auth hook
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    redirectUri: makeRedirectUri({
      scheme: 'ultraedge',
      path: 'auth/callback',
    }),
  });

  // Initialize Supabase client
  useEffect(() => {
    const initSupabase = async () => {
      try {
        const client = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
          auth: {
            // Sessions are encrypted at rest via expo-secure-store
            // (AsyncStorage fallback on web).
            storage: createSecureStorageAdapter(),
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        });

        setSupabase(client);

        // Get existing session
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }

        setState({
          user: session?.user ?? null,
          session: session ?? null,
          isLoading: false,
          isAuthenticated: !!session?.user,
        });

        // Listen for auth state changes
        const { data: { subscription } } = client.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            
            setState(prev => ({
              ...prev,
              user: session?.user ?? null,
              session: session ?? null,
              isAuthenticated: !!session?.user,
            }));

            // Handle specific events
            if (event === 'SIGNED_IN' && session?.user) {
              // Ensure profile exists
              await ensureProfileExists(client, session.user);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Failed to initialize Supabase:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initSupabase();
  }, []);

  // Handle Google auth response
  useEffect(() => {
    if (googleResponse?.type === 'success' && supabase) {
      const { id_token } = googleResponse.params;
      handleGoogleIdToken(id_token);
    }
  }, [googleResponse, supabase]);

  // Handle password-reset deep links (ultraedge://auth/reset-password).
  // Tokens arriving via deep link are attacker-reachable input: validate
  // shape, type, and error params before establishing a session.
  useEffect(() => {
    if (!supabase) return;

    const handleDeepLink = async (url: string | null) => {
      if (!url || !url.includes('auth/reset-password')) return;

      const params = parseAuthParamsFromUrl(url);
      if (!params) {
        console.warn('Ignoring malformed auth deep link');
        return;
      }

      // Surface provider errors instead of silently proceeding
      if (params.get('error') || params.get('error_code')) {
        Alert.alert(
          'Password Reset Failed',
          params.get('error_description') || 'The reset link is invalid or has expired. Please request a new one.'
        );
        return;
      }

      const type = params.get('type');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      // Only accept recovery-type links with well-formed tokens
      if (type !== 'recovery' || !isValidJwt(accessToken) || !isValidRefreshToken(refreshToken)) {
        console.warn('Ignoring auth deep link with invalid or missing recovery tokens');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        Alert.alert(
          'Password Reset Failed',
          'The reset link is invalid or has expired. Please request a new one.'
        );
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle the case where the app was cold-started from the reset link
    Linking.getInitialURL().then(handleDeepLink).catch(() => {});

    return () => {
      subscription.remove();
    };
  }, [supabase]);

  // Ensure user profile exists in database
  const ensureProfileExists = async (client: SupabaseClient, user: User) => {
    try {
      const { data: existingProfile, error: fetchError } = await client
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected for new users
        console.error('Error checking profile:', fetchError);
        return;
      }

      if (!existingProfile) {
        // Create profile for new user
        const displayName = 
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Runner';

        const { error: insertError } = await client
          .from('profiles')
          .insert({
            id: user.id,
            name: displayName,
            email: user.email,
            is_premium: false,
            preferences: {
              distanceUnit: 'miles',
              elevationUnit: 'ft',
              notifications: true,
              darkMode: false,
            },
            created_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error in ensureProfileExists:', error);
    }
  };

  // ============================================================================
  // EMAIL AUTH
  // ============================================================================

  const signInWithEmail = useCallback(async (
    email: string,
    password: string
  ): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Auth not initialized' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      return { success: true, user: data.user ?? undefined };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [supabase]);

  const signUpWithEmail = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Auth not initialized' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: displayName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { 
          success: true, 
          needsEmailConfirmation: true,
          user: data.user,
        };
      }

      return { success: true, user: data.user ?? undefined };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [supabase]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Auth not initialized' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: 'ultraedge://auth/reset-password',
        }
      );

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }, [supabase]);

  // ============================================================================
  // APPLE SIGN-IN
  // ============================================================================

  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Auth not initialized' };
    }

    // Apple Sign-In is only available on iOS
    if (Platform.OS !== 'ios') {
      return { success: false, error: 'Apple Sign-In is only available on iOS' };
    }

    try {
      // Check if Apple authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        return { success: false, error: 'Apple Sign-In is not available on this device' };
      }

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        return { success: false, error: 'No identity token received from Apple' };
      }

      // Sign in with Supabase using the Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      // Update profile with Apple name if provided (Apple only provides name on first sign-in)
      if (credential.fullName && data.user) {
        const fullName = [
          credential.fullName.givenName,
          credential.fullName.familyName,
        ].filter(Boolean).join(' ');

        if (fullName) {
          await supabase
            .from('profiles')
            .update({ name: fullName })
            .eq('id', data.user.id);
        }
      }

      return { success: true, user: data.user ?? undefined };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      console.error('Apple sign in error:', error);
      return { success: false, error: 'Apple Sign-In failed' };
    }
  }, [supabase]);

  // ============================================================================
  // GOOGLE SIGN-IN
  // ============================================================================

  const handleGoogleIdToken = async (idToken: string) => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        Alert.alert('Sign-In Error', getAuthErrorMessage(error));
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      Alert.alert('Sign-In Error', 'Google Sign-In failed');
    }
  };

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) {
      return { success: false, error: 'Auth not initialized' };
    }

    if (!googleRequest) {
      // Fallback: Use Supabase's OAuth flow directly
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: makeRedirectUri({
              scheme: 'ultraedge',
              path: 'auth/callback',
            }),
            skipBrowserRedirect: true,
          },
        });

        if (error) {
          return { success: false, error: getAuthErrorMessage(error) };
        }

        if (data.url) {
          const result = await WebBrowser.openAuthSessionAsync(
            data.url,
            makeRedirectUri({ scheme: 'ultraedge', path: 'auth/callback' })
          );

          if (result.type === 'success' && result.url) {
            // Parse and validate tokens from the callback URL (fragment or
            // query). Reject anything that is not a well-formed token pair.
            const params = parseAuthParamsFromUrl(result.url);
            const accessToken = params?.get('access_token');
            const refreshToken = params?.get('refresh_token');

            if (isValidJwt(accessToken) && isValidRefreshToken(refreshToken)) {
              const { error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
              if (sessionError) {
                return { success: false, error: getAuthErrorMessage(sessionError) };
              }
              return { success: true };
            }
          }
        }

        return { success: false, error: 'Google Sign-In was cancelled or failed' };
      } catch (error) {
        console.error('Google OAuth error:', error);
        return { success: false, error: 'Google Sign-In failed' };
      }
    }

    try {
      const result = await googlePromptAsync();
      
      if (result.type === 'success') {
        // The useEffect above will handle the response
        return { success: true };
      } else if (result.type === 'cancel') {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      
      return { success: false, error: 'Google Sign-In failed' };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: 'Google Sign-In failed' };
    }
  }, [supabase, googleRequest, googlePromptAsync]);

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  const signOut = useCallback(async (): Promise<void> => {
    if (!supabase) return;

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [supabase]);

  const refreshSession = useCallback(async (): Promise<void> => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh error:', error);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, [supabase]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    ...state,
    supabase,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInWithApple,
    signInWithGoogle,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getAuthErrorMessage(error: AuthError): string {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please check your email to confirm your account',
    'User already registered': 'An account with this email already exists',
    'Password should be at least 6 characters': 'Password must be at least 6 characters',
    'Email rate limit exceeded': 'Too many attempts. Please try again later',
    'Invalid email': 'Please enter a valid email address',
  };

  return errorMessages[error.message] || error.message || 'An error occurred';
}

export default AuthProvider;
