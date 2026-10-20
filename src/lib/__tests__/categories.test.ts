import { availableCategories, branchMatchesCategory, menuText } from '@/lib/categories';
import type { Branch } from '@/types/branch';
import type { Menu } from '@/types/product';

const branch = (name: string) => ({ id: name, name }) as Branch;

it('matches by branch name in either language', () => {
  expect(branchMatchesCategory(branch('Artisan Pizza House Heights #052'), 'pizza')).toBe(true);
  expect(branchMatchesCategory(branch('Premium Burger Co Plaza #023'), 'burger')).toBe(true);
  expect(branchMatchesCategory(branch('Dharma Coffee'), 'coffee')).toBe(true);
  expect(branchMatchesCategory(branch('Moda Kahvecisi'), 'coffee')).toBe(true);
  expect(branchMatchesCategory(branch('Premium Burger Co'), 'pizza')).toBe(false);
});

it('matches by menu text', () => {
  const menu = { categories: [{ id: 'c', name: 'Tatlılar', description: null, products: [{ name: 'Künefe', description: null }] }] } as unknown as Menu;
  expect(branchMatchesCategory(branch('Usta'), 'dessert', menuText(menu))).toBe(true);
});

it('lists only categories some branch matches, in fixed order', () => {
  expect(availableCategories([branch('Artisan Pizza'), branch('Premium Burger')], {})).toEqual(['pizza', 'burger']);
});

it('matches keywords at the start of a word only', () => {
  expect(branchMatchesCategory(branch('Seafood Platter'), 'coffee')).toBe(false);
  expect(branchMatchesCategory(branch('Lattes & More'), 'coffee')).toBe(true);
  expect(branchMatchesCategory(branch('Kebapçı Halil'), 'kebab')).toBe(true);
  expect(branchMatchesCategory(branch('Usta'), 'dessert', 'vanilla ice cream')).toBe(true);
  expect(branchMatchesCategory(branch('Usta'), 'dessert', 'rice cream soup')).toBe(false);
});
