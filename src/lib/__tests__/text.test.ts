import { foldText } from '@/lib/text';

it('folds Turkish letters and case', () => {
  expect(foldText('İstanbul Ağacı ÇÖŞÜ')).toBe('istanbul agaci cosu');
  expect(foldText('Döner')).toBe('doner');
});
