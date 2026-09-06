/**
 * Onboarding persistence — first-launch flag stored locally.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_COMPLETE_KEY = '@ultraedge/onboarding-complete';

export async function isOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY)) === 'true';
  } catch {
    // If storage is unreadable, don't trap the user in onboarding
    return true;
  }
}

export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  } catch (err) {
    console.error('Failed to persist onboarding flag:', err);
  }
}
