import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { setMoneyLocale } from './money';

export type AppLanguage = 'tr' | 'en';
const KEY = 'rm_lang';

/** Turkish devices get Turkish; everything else English (portalfe's rule). */
export function detectLanguage(): AppLanguage {
  return getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';
}

/** Restores the saved choice, falling back to the device locale when none is stored. */
export async function loadLanguage(): Promise<AppLanguage> {
  const saved = (await AsyncStorage.getItem(KEY).catch(() => null)) as AppLanguage | null;
  const lang = saved === 'tr' || saved === 'en' ? saved : detectLanguage();
  await apply(lang);
  return lang;
}

export async function changeLanguage(lang: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(KEY, lang);
  await apply(lang);
}

/** Money follows the language too, so prices and labels never disagree on separators. */
async function apply(lang: AppLanguage) {
  setMoneyLocale(lang);
  if (i18n.language !== lang) {
    // eslint-disable-next-line import/no-named-as-default-member -- default instance; named export loses `this`
    await i18n.changeLanguage(lang);
  }
}
