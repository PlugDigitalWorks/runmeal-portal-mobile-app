import { searchBranches, searchProducts } from '@/lib/search';
import type { Branch } from '@/types/branch';
import type { Menu } from '@/types/product';

const b = (id: string, name: string) => ({ id, name, distanceM: 1 }) as Branch;
const branches = [b('p', 'Artisan Pizza House'), b('k', 'Köfteci Ramiz')];
const menus: Record<string, Menu> = {
  p: {
    branchId: 'p',
    brandId: 'rp',
    currency: 'TRY',
    currencySymbol: '₺',
    categories: [
      {
        id: 'c',
        name: 'Pizzas',
        description: null,
        products: [
          { id: 'm1', name: 'Margherita', description: 'Domates, mozzarella', price: 200 } as never,
          { id: 'm2', name: 'Pepperoni', description: null, price: 240 } as never,
        ],
      },
    ],
  },
};

it('needs at least two characters', () => {
  expect(searchBranches('a', branches)).toEqual([]);
  expect(searchProducts('m', branches, menus)).toEqual([]);
});

it('finds branches accent-insensitively', () => {
  expect(searchBranches('kofte', branches).map((x) => x.id)).toEqual(['k']);
});

it('finds products by name or description and keeps their branch', () => {
  const hits = searchProducts('mozza', branches, menus);
  expect(hits).toHaveLength(1);
  expect(hits[0]).toMatchObject({ product: { id: 'm1' }, branch: { id: 'p' }, brandId: 'rp' });
});

it('ranks name-prefix matches first', () => {
  const hits = searchProducts('pe', branches, menus);
  expect(hits[0].product.id).toBe('m2');
});

it('skips branches whose menu has not loaded and honours the limit', () => {
  expect(searchProducts('pe', [b('k', 'x')], menus)).toEqual([]);
  expect(searchProducts('ma', branches, menus, 1)).toHaveLength(1);
});
