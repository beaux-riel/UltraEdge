/**
 * Tests for the first-launch onboarding flag.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  isOnboardingComplete,
  setOnboardingComplete,
  ONBOARDING_COMPLETE_KEY,
} from '../lib/onboarding';

describe('onboarding flag', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('reports incomplete on first launch', async () => {
    expect(await isOnboardingComplete()).toBe(false);
  });

  it('reports complete after the flag is set', async () => {
    await setOnboardingComplete();
    expect(await isOnboardingComplete()).toBe(true);
    expect(await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)).toBe('true');
  });

  it('defaults to complete if storage is unreadable', async () => {
    jest
      .spyOn(AsyncStorage, 'getItem')
      .mockRejectedValueOnce(new Error('storage unavailable'));
    expect(await isOnboardingComplete()).toBe(true);
  });
});
