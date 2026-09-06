/** Optional account services. Race plans remain local and do not sync on sign-in. */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import { supabase as sharedClient, isAuthAvailable } from '../lib/supabase';
import { AUTH_CALLBACK_URL, PASSWORD_RESET_URL, parseAuthCallback, recoveryTokens } from '../lib/authLinks';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

if (isAuthAvailable) WebBrowser.maybeCompleteAuthSession();
const unavailable = 'Account services are unavailable in this build. Your local planner still works.';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  needsEmailConfirmation?: boolean;
}
export interface AuthContextType extends AuthState {
  isAuthAvailable: boolean;
  isPasswordRecovery: boolean;
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  cancelPasswordRecovery: () => Promise<void>;
  signInWithApple: () => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  supabase: SupabaseClient | null;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const anonymous = { user: null, session: null, isLoading: false, isAuthenticated: false };

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase: SupabaseClient | null = isAuthAvailable ? sharedClient : null;
  const [state, setState] = useState<AuthState>({ ...anonymous, isLoading: isAuthAvailable });
  const [isPasswordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let authEventReceived = false;
    const applySession = (session: Session | null) => {
      if (active) setState({ user: session?.user ?? null, session, isLoading: false, isAuthenticated: !!session?.user });
    };
    // Subscribe synchronously and always clean up. Never await another auth call inside this callback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      authEventReceived = true;
      applySession(session);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      if (event === 'SIGNED_OUT') setPasswordRecovery(false);
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (!authEventReceived) applySession(error ? null : data.session);
    }).catch(() => { if (!authEventReceived) applySession(null); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let processing = false;
    const handleLink = async (url: string | null) => {
      if (!url || processing) return;
      const params = parseAuthCallback(url, 'reset-password');
      if (!params) return;
      processing = true;
      try {
        if (params.get('error') || params.get('error_code')) throw new Error('Invalid recovery link');
        // PKCE codes can only be exchanged by the installation that requested recovery.
        const code = params.get('code');
        const tokens = recoveryTokens(params);
        if (!code && !tokens) throw new Error('Invalid recovery link');
        const { data, error } = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.setSession(tokens!);
        if (error || !data.session) throw new Error('Expired recovery link');
        if (active) setPasswordRecovery(true);
      } catch {
        if (active) Alert.alert('Password Reset Failed', 'The reset link is invalid or has expired. Request a new link from Sign In.');
      } finally { processing = false; }
    };
    const subscription = Linking.addEventListener('url', ({ url }) => { void handleLink(url); });
    Linking.getInitialURL().then(handleLink).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, [supabase]);

  const attempt = async (operation: () => Promise<AuthResult>): Promise<AuthResult> => {
    if (!supabase) return { success: false, error: unavailable };
    try { return await operation(); }
    catch { return { success: false, error: 'Account service could not be reached. Please try again.' }; }
  };

  const signInWithEmail = (email: string, password: string) => attempt(async () => {
    const { data, error } = await supabase!.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    return error ? { success: false, error: error.message } : { success: true, user: data.user };
  });
  const signUpWithEmail = (email: string, password: string, displayName?: string) => attempt(async () => {
    // Migration 002 creates user_profiles by trigger, keyed by user_id. Do not write the legacy profiles table.
    const { data, error } = await supabase!.auth.signUp({ email: email.trim().toLowerCase(), password,
      options: { data: { name: displayName?.trim() || email.split('@')[0] } } });
    return error ? { success: false, error: error.message } : {
      success: true, user: data.user ?? undefined, needsEmailConfirmation: !!data.user && !data.session,
    };
  });
  const resetPassword = (email: string) => attempt(async () => {
    const { error } = await supabase!.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: PASSWORD_RESET_URL });
    return error ? { success: false, error: error.message } : { success: true };
  });
  const updatePassword = (password: string) => attempt(async () => {
    if (!isPasswordRecovery || !state.session) return { success: false, error: 'Open a new password reset link first.' };
    if (password.length < 8) return { success: false, error: 'Use at least 8 characters.' };
    const { error } = await supabase!.auth.updateUser({ password });
    if (error) return { success: false, error: error.message };
    setPasswordRecovery(false);
    return { success: true };
  });
  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    setState(anonymous);
    setPasswordRecovery(false);
  };
  const refreshSession = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;
  };
  const signInWithApple = () => attempt(async () => {
    if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync())) {
      return { success: false, error: 'Apple Sign-In is unavailable on this device.' };
    }
    const nonce = Crypto.randomUUID();
    const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, nonce);
    let credential;
    try {
      credential = await AppleAuthentication.signInAsync({ nonce: hashedNonce, requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ] });
    } catch (error) {
      return { success: false, error: (error as { code?: string }).code === 'ERR_REQUEST_CANCELED' ? 'Sign-in was cancelled' : 'Apple Sign-In failed' };
    }
    if (!credential.identityToken) return { success: false, error: 'Apple did not return an identity token.' };
    const { data, error } = await supabase!.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce });
    if (error) return { success: false, error: error.message };
    const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
    if (name) {
      // User metadata preserves the one-time Apple name; profile creation is a server responsibility.
      const { error: nameError } = await supabase!.auth.updateUser({ data: { full_name: name } });
      if (nameError) Alert.alert('Signed In', 'Your name could not be saved. You can edit your local profile.');
    }
    return { success: true, user: data.user ?? undefined };
  });
  const signInWithGoogle = () => attempt(async () => {
    const { data, error } = await supabase!.auth.signInWithOAuth({ provider: 'google', options: {
      redirectTo: AUTH_CALLBACK_URL, skipBrowserRedirect: true,
    } });
    if (error) return { success: false, error: error.message };
    if (!data.url) return { success: false, error: 'Google Sign-In could not be started.' };
    const response = await WebBrowser.openAuthSessionAsync(data.url, AUTH_CALLBACK_URL);
    if (response.type !== 'success') return { success: false, error: 'Sign-in was cancelled' };
    const params = parseAuthCallback(response.url, 'callback');
    const code = params?.get('code');
    if (!code || params?.get('error')) return { success: false, error: 'Invalid Google Sign-In callback. Please try again.' };
    const { error: exchangeError } = await supabase!.auth.exchangeCodeForSession(code);
    return exchangeError ? { success: false, error: exchangeError.message } : { success: true };
  });
  return <AuthContext.Provider value={{ ...state, supabase, isAuthAvailable, isPasswordRecovery,
    signInWithEmail, signUpWithEmail, resetPassword, updatePassword, cancelPasswordRecovery: signOut,
    signInWithApple, signInWithGoogle, signOut, refreshSession }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
export default AuthProvider;
