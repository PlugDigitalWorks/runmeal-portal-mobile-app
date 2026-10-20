import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_NOTIF_PREFS, NOTIF_KEYS, type NotifPrefs } from '@/mocks/account-mocks';

const KEY = 'rm_notif_prefs';

/** The saved switches, each falling back to its default when storage is empty or broken. Nothing reaches push yet. */
export async function loadNotifPrefs(): Promise<NotifPrefs> {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '{}') as Partial<Record<string, unknown>>;
    return Object.fromEntries(NOTIF_KEYS.map((key) => [key, typeof parsed[key] === 'boolean' ? parsed[key] : DEFAULT_NOTIF_PREFS[key]])) as NotifPrefs;
  } catch {
    return { ...DEFAULT_NOTIF_PREFS };
  }
}

export async function saveNotifPrefs(prefs: NotifPrefs): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(prefs)).catch(() => undefined);
}
