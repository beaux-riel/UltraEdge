/** Build secrets must never silently turn the free local release into an online app. */
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));
jest.mock('react-native-get-random-values', () => ({}));
jest.mock('react-native-url-polyfill/auto', () => ({}));

it('does not construct a cloud client or touch session storage even with valid build credentials', async () => {
  const previousUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://race-planning.supabase.co';
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'eyJvalid-looking-public-key-for-build-test';
  try {
    const { isAuthAvailable, supabase, requireSupabase, signIn } = require('../lib/supabase');
    const { createClient } = require('@supabase/supabase-js');
    const secureStore = require('expo-secure-store');
    expect(isAuthAvailable).toBe(false);
    expect(supabase).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
    expect(secureStore.getItemAsync).not.toHaveBeenCalled();
    expect(() => requireSupabase()).toThrow('Account services are unavailable');
    await expect(signIn('runner@example.com', 'unused')).rejects.toThrow('Account services are unavailable');
    expect(createClient).not.toHaveBeenCalled();
  } finally {
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});
