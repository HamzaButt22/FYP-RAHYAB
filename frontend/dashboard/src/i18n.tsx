// Dashboard text, English only since 16 Nov 2026 (ADR-0016): one JSON dictionary and a
// `t('roster.title', { name })` lookup with {{placeholders}}. All copy stays in messages/en.json so it can be
// reviewed in one place. No library: the dashboard has few strings, and plain JSON moves to react-i18next
// unchanged if it grows.

import { createContext, useContext, useMemo, type ReactNode } from 'react';

import en from './messages/en.json';

export const MESSAGES = { en } as const;

type Params = Record<string, string | number>;

export function lookup(key: string, params: Params = {}): string {
  let node: unknown = MESSAGES.en;
  for (const part of key.split('.')) node = (node as Record<string, unknown> | undefined)?.[part];
  if (typeof node !== 'string') return key; // a missing key shows itself instead of failing silently
  return node.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name] ?? ''));
}

type I18n = { t: (key: string, params?: Params) => string };
const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ t: (key: string, params?: Params) => lookup(key, params) }), []);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
