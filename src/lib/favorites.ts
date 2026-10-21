import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Branch } from '@/types/branch';

export type FavoriteBranch = Pick<Branch, 'id' | 'name' | 'logoUrl' | 'bannerUrls' | 'addressText'>;
const KEY = 'rm_favorites';

/** Device-only until the API has favourites (docs/BACKEND_REQUESTS.md). */
export async function loadFavorites(): Promise<FavoriteBranch[]> {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(branch: FavoriteBranch): Promise<FavoriteBranch[]> {
  const current = await loadFavorites();
  const next = current.some((f) => f.id === branch.id)
    ? current.filter((f) => f.id !== branch.id)
    : [{ id: branch.id, name: branch.name, logoUrl: branch.logoUrl, bannerUrls: branch.bannerUrls, addressText: branch.addressText }, ...current];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export const clearFavorites = () => AsyncStorage.removeItem(KEY);
