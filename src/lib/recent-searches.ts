import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'rm_recent_searches';
const MAX = 8;

export async function loadRecent(): Promise<string[]> {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Newest first, no case-insensitive duplicates, at most eight. */
export async function pushRecent(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return loadRecent();
  const next = [q, ...(await loadRecent()).filter((x) => x.toLocaleLowerCase() !== q.toLocaleLowerCase())].slice(0, MAX);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export const clearRecent = () => AsyncStorage.removeItem(KEY);
