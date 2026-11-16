// Small settings kept on the phone in the Android Keystore-backed secure store (NFR-39).
// Only non-personal settings live here for now; the event outbox gets its own encrypted database (ADR-0010).

import * as SecureStore from 'expo-secure-store';

const KEYS = {
  onboardingDone: 'onboarding.done',
} as const;

export async function loadOnboardingDone(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEYS.onboardingDone)) === 'yes';
}

export async function saveOnboardingDone(done: boolean): Promise<void> {
  if (done) await SecureStore.setItemAsync(KEYS.onboardingDone, 'yes');
  else await SecureStore.deleteItemAsync(KEYS.onboardingDone);
}
