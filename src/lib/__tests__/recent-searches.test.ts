import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearRecent, loadRecent, pushRecent } from '@/lib/recent-searches';

beforeEach(() => AsyncStorage.clear());

it('keeps eight unique searches, newest first', async () => {
  for (const q of ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8', 'i9']) await pushRecent(q);
  await pushRecent('C3');
  const list = await loadRecent();
  expect(list).toHaveLength(8);
  expect(list[0]).toBe('C3');
  expect(list.filter((x) => x.toLowerCase() === 'c3')).toHaveLength(1);
});

it('ignores blank searches and clears', async () => {
  await pushRecent('pizza');
  expect(await pushRecent('   ')).toEqual(['pizza']);
  await clearRecent();
  expect(await loadRecent()).toEqual([]);
});
