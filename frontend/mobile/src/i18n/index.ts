// English and Urdu interface text (FR-01, NFR-27). Keys follow `domain.screen.element` (SRS §7.4).
// Story dialogue (Roman Urdu / English / Urdu script) comes from the Ink files, not from here.
// Urdu strings are drafts until a native Urdu editor reviews them (SRS §7.4, NFR-26).

import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import { reloadAppAsync } from 'expo';

import { saveLanguage, type Language } from '@/state/storage';
import en from './locales/en.json';
import ur from './locales/ur.json';

export const resources = { en: { translation: en }, ur: { translation: ur } } as const;

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: (typeof resources)['en'];
  }
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }, // React already escapes
  returnNull: false,
  initAsync: false,
});

export const isRtl = (language: Language) => language === 'ur';

/** Wraps English words or numbers inside Urdu text so they keep their own direction (FSI … PDI). */
export function isolate(text: string): string {
  return `⁨${text}⁩`;
}

/**
 * Switches the interface language. Urdu mirrors the layout, which Android applies only after a reload,
 * so the app restarts when the direction changes (SRS §7.4).
 */
export async function setLanguage(language: Language): Promise<void> {
  await saveLanguage(language);
  await i18n.changeLanguage(language);
  const rtl = isRtl(language);
  if (I18nManager.isRTL !== rtl) {
    I18nManager.allowRTL(rtl);
    I18nManager.forceRTL(rtl);
    await reloadAppAsync('Language direction changed');
  }
}

export default i18n;
