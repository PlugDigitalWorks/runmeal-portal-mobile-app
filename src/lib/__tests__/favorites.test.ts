import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadFavorites, toggleFavorite } from '@/lib/favorites';

const fav = { id: 'b1', name: 'Pizza', logoUrl: null, bannerUrls: null, addressText: null };

beforeEach(() => AsyncStorage.clear());

it('adds then removes a favorite and survives a reload', async () => {
  expect(await toggleFavorite(fav)).toEqual([fav]);
  expect(await loadFavorites()).toEqual([fav]);
  expect(await toggleFavorite(fav)).toEqual([]);
});

it('ignores corrupt storage', async () => {
  await AsyncStorage.setItem('rm_favorites', '{oops');
  expect(await loadFavorites()).toEqual([]);
});
