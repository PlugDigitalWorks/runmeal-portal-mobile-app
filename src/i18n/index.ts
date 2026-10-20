import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import tr from './locales/tr.json';
import { detectLanguage } from '@/lib/language';

/**
 * Importing this module starts i18next. Every screen depends on it, so the
 * app never renders with an uninitialised translator. Namespace is `common`
 * and the JSON's top-level sections are key prefixes (`t('errors.network')`).
 */
// The default instance is required: i18next's named `use` loses `this` and would break.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: { tr: { common: tr }, en: { common: en } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
