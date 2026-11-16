// What the navigation needs to know at start-up: the student's sign-in (session) and whether onboarding is
// finished. The interface is English only and always left to right (ADR-0016).

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { reloadAppAsync } from 'expo';

import { deleteKey } from '../../modules/device-key';
import { clearSession, loadSession, saveConsentState, type Session } from './session';
import { loadOnboardingDone, saveOnboardingDone } from './storage';

interface AppState {
  ready: boolean;
  session: Session | null;
  onboardingDone: boolean;
  signedIn: (session: Session) => void;
  consentGranted: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
  /** Development builds only: forget the sign-in and the device key, and start again at S-02. */
  resetOnboarding: () => Promise<void>;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [onboardingDone, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      // Android keeps the layout direction across launches (and follows a right-to-left phone language
      // unless told not to). The interface is left to right only, so repair it once if needed.
      if (I18nManager.isRTL) {
        I18nManager.allowRTL(false);
        I18nManager.forceRTL(false);
        await reloadAppAsync('Layout direction set to left to right');
        return;
      }
      const [done, signedIn] = await Promise.all([loadOnboardingDone(), loadSession()]);
      // Onboarding counts as finished only while the student is signed in (a 401 on refresh signs them out);
      // a flag left from an earlier sign-in is cleared so it cannot skip S-04 after the next join.
      if (done && !signedIn) await saveOnboardingDone(false);
      setSession(signedIn);
      setDone(done && signedIn !== null);
      setReady(true);
    })();
  }, []);

  const signedIn = useCallback((next: Session) => {
    setSession(next);
    // A new sign-in without consent always goes through S-04 (join.tsx finishes onboarding first when a
    // slip was already claimed).
    if (next.consentState !== 'granted') {
      setDone(false);
      void saveOnboardingDone(false);
    }
  }, []);

  const consentGranted = useCallback(async () => {
    await saveConsentState('granted');
    setSession((s) => (s ? { ...s, consentState: 'granted' } : s));
  }, []);

  const finishOnboarding = useCallback(async () => {
    await saveOnboardingDone(true);
    setDone(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await saveOnboardingDone(false);
    await clearSession();
    await deleteKey().catch(() => undefined);
    setSession(null);
    setDone(false);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      session,
      onboardingDone,
      signedIn,
      consentGranted,
      finishOnboarding,
      resetOnboarding,
    }),
    [ready, session, onboardingDone, signedIn, consentGranted, finishOnboarding, resetOnboarding],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}
