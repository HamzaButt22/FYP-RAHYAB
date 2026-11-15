// English and Urdu for the dashboard: two JSON dictionaries with the same keys (i18n.test.ts checks
// that), a `t('roster.title', { name })` lookup with {{placeholders}}, and the page direction.
// No library: the dashboard has few strings, and plain JSON moves to react-i18next unchanged if it grows.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import en from './messages/en.json';
import ur from './messages/ur.json';

export type Lang = 'en' | 'ur';
export const MESSAGES = { en, ur } as const;
const KEY = 'rahyaab.dashboard.lang';

type Params = Record<string, string | number>;

export function lookup(lang: Lang, key: string, params: Params = {}): string {
  let node: unknown = MESSAGES[lang];
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  if (typeof node !== 'string') return key; // a missing key shows itself instead of failing silently
  return node.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name] ?? ''));
}

/** Sets <html lang dir> in the same step as the language, so Urdu never shows in a left-to-right page. */
export function applyDirection(lang: Lang): void {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
}

function savedLang(): Lang {
  try {
    return localStorage.getItem(KEY) === 'ur' ? 'ur' : 'en';
  } catch {
    return 'en'; // storage blocked: English by default
  }
}

type I18n = { lang: Lang; setLang: (lang: Lang) => void; t: (key: string, params?: Params) => string };
const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setState] = useState<Lang>(savedLang);
  useEffect(() => applyDirection(lang), [lang]);
  const setLang = useCallback((next: Lang) => {
    applyDirection(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // not saved; the choice still applies until the page is reloaded
    }
    setState(next);
  }, []);
  const value = useMemo(
    () => ({ lang, setLang, t: (key: string, params?: Params) => lookup(lang, key, params) }),
    [lang, setLang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
