// What the navigation needs to know at start-up: the chosen language and whether onboarding is finished.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { reloadAppAsync } from 'expo';

import i18n, { isRtl, setLanguage } from '@/i18n';
import { loadLanguage, loadOnboardingDone, saveOnboardingDone, type Language } from './storage';

interface AppState {
  ready: boolean;
  language: Language | null;
  onboardingDone: boolean;
  chooseLanguage: (language: Language) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLang] = useState<Language | null>(null);
  const [onboardingDone, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const [saved, done] = await Promise.all([loadLanguage(), loadOnboardingDone()]);
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
      setLang(saved);
      setDone(done);
      setReady(true);
    })();
  }, []);

  const chooseLanguage = useCallback(async (next: Language) => {
    await setLanguage(next); // reloads the app when the direction changes
    setLang(next);
  }, []);

  const finishOnboarding = useCallback(async () => {
    await saveOnboardingDone(true);
    setDone(true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    await saveOnboardingDone(false);
    setDone(false);
  }, []);

  const value = useMemo(
    () => ({ ready, language, onboardingDone, chooseLanguage, finishOnboarding, resetOnboarding }),
    [ready, language, onboardingDone, chooseLanguage, finishOnboarding, resetOnboarding],
  );
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const state = useContext(AppStateContext);
  if (!state) throw new Error('useAppState must be used inside AppStateProvider');
  return state;
}
