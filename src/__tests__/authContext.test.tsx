import React from 'react';
import { Linking } from 'react-native';
import { AuthProvider, AuthContextType, useAuth } from '../context/AuthContext';
const { act, create } = require('react-test-renderer');

let mockAvailable = true;
let mockAuthEvent: (event: string, session: unknown) => void;
const mockUnsubscribe = jest.fn();
const mockSession = { user: { id: 'runner-1' }, access_token: 'test' };
const mockAuth = {
  getSession: jest.fn(), onAuthStateChange: jest.fn(), signInWithPassword: jest.fn(), signUp: jest.fn(),
  resetPasswordForEmail: jest.fn(), updateUser: jest.fn(), signOut: jest.fn(), refreshSession: jest.fn(),
  exchangeCodeForSession: jest.fn(), setSession: jest.fn(),
};
jest.mock('../lib/supabase', () => ({
  get isAuthAvailable() { return mockAvailable; }, supabase: { get auth() { return mockAuth; } },
}));
jest.mock('expo-apple-authentication', () => ({}));
jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));
jest.mock('expo-crypto', () => ({}));
let current: AuthContextType;
function Probe() { current = useAuth(); return null; }
let tree: any;
async function mount() { await act(async () => { tree = create(<AuthProvider><Probe /></AuthProvider>); }); }

beforeEach(() => {
  jest.clearAllMocks(); mockAvailable = true;
  mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mockAuth.onAuthStateChange.mockImplementation((callback) => {
    mockAuthEvent = callback; return { data: { subscription: { unsubscribe: mockUnsubscribe } } };
  });
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
});
afterEach(async () => { if (tree) await act(async () => { tree.unmount(); tree = null; }); jest.restoreAllMocks(); });

it('boots locally without credentials and performs no auth requests', async () => {
  mockAvailable = false; await mount();
  expect(current.isLoading).toBe(false); expect(current.supabase).toBeNull();
  expect(mockAuth.getSession).not.toHaveBeenCalled();
  expect((await current.signInWithEmail('runner@example.com', 'password')).success).toBe(false);
  expect(mockAuth.signInWithPassword).not.toHaveBeenCalled();
});
it('unsubscribes the shared client listener on unmount', async () => {
  await mount(); await act(async () => { tree.unmount(); tree = null; });
  expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
});
it('opens recovery on cold launch only after code exchange succeeds and updates the password', async () => {
  jest.spyOn(Linking, 'getInitialURL').mockResolvedValue('ultraedge://auth/reset-password?code=valid-code');
  mockAuth.exchangeCodeForSession.mockImplementation(async () => {
    mockAuthEvent('SIGNED_IN', mockSession); return { data: { session: mockSession }, error: null };
  });
  await mount(); expect(current.isPasswordRecovery).toBe(true);
  mockAuth.updateUser.mockResolvedValue({ error: null });
  let result;
  await act(async () => { result = await current.updatePassword('new-password'); });
  expect(result).toEqual({ success: true }); expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
  expect(current.isPasswordRecovery).toBe(false);
});
it('does not enable password update without a recovery session', async () => {
  await mount(); expect((await current.updatePassword('new-password')).success).toBe(false);
  expect(mockAuth.updateUser).not.toHaveBeenCalled();
});
it('does not report sign-out success when session removal fails', async () => {
  await mount(); await act(async () => { mockAuthEvent('SIGNED_IN', mockSession); });
  mockAuth.signOut.mockResolvedValue({ error: new Error('Storage unavailable') });
  await expect(current.signOut()).rejects.toThrow('Storage unavailable');
  expect(current.isAuthenticated).toBe(true);
});
it('keeps recovery open if the password update fails', async () => {
  await mount(); await act(async () => { mockAuthEvent('PASSWORD_RECOVERY', mockSession); });
  mockAuth.updateUser.mockResolvedValue({ error: { message: 'Password rejected' } });
  expect((await current.updatePassword('new-password')).success).toBe(false);
  expect(current.isPasswordRecovery).toBe(true);
});
