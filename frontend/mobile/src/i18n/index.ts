// Interface text (FR-01, NFR-27). English only since 16 Nov 2026 (ADR-0016); all copy stays in en.json so
// it can be reviewed in one place. Keys follow `domain.screen.element` (SRS §7.4).

import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';

export const resources = { en: { translation: en } } as const;

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

export default i18n;
