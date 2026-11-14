// What the navigation needs to know at start-up: the chosen language, the student's sign-in (session),
// and whether onboarding is finished.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { reloadAppAsync } from 'expo';

import i18n, { isRtl, setLanguage } from '@/i18n';
import { deleteKey } from '../../modules/device-key';
import { clearSession, loadSession, saveConsentState, type Session } from './session';
import { loadLanguage, loadOnboardingDone, saveOnboardingDone, type Language } from './storage';

interface AppState {
  ready: boolean;
  language: Language | null;
  session: Session | null;
  onboardingDone: boolean;
  chooseLanguage: (language: Language) => Promise<void>;
  signedIn: (session: Session) => void;
  consentGranted: () => Promise<void>;
  finishOnboarding: () => Promise<void>;
  /** Development builds only: forget the sign-in and the device key, and start again at S-02. */
  resetOnboarding: () => Promise<void>;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLang] = useState<Language | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [onboardingDone, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const [saved, done, signedIn] = await Promise.all([loadLanguage(), loadOnboardingDone(), loadSession()]);
      if (saved) {
        await i18n.changeLanguage(saved);
        // Android keeps the layout direction across launches; repair it if it no longer matches.
        if (I18nManager.isRTL !== isRtl(saved)) {
          I18nManager.allowRTL(isRtl(saved));
          I18nManager.forceRTL(isRtl(saved));
          await reloadAppAsync('Language direction repaired');
          return;
        }
      }
      // Onboarding counts as finished only while the student is signed in (a 401 on refresh signs them out);
      // a flag left from an earlier sign-in is cleared so it cannot skip S-04 after the next join.
      if (done && !signedIn) await saveOnboardingDone(false);
      setLang(saved);
      setSession(signedIn);
      setDone(done && signedIn !== null);
      setReady(true);
    })();
  }, []);

  const chooseLanguage = useCallback(async (next: Language) => {
    await setLanguage(next); // reloads the app when the direction changes
    setLang(next);
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
      language,
      session,
      onboardingDone,
      chooseLanguage,
      signedIn,
      consentGranted,
      finishOnboarding,
      resetOnboarding,
    }),
    [ready, language, session, onboardingDone, chooseLanguage, signedIn, consentGranted, finishOnboarding, resetOnboarding],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}
