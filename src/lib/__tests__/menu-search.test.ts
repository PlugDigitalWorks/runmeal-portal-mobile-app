import { searchMenu } from '@/lib/menu-search';
import type { MenuCategory, MenuProduct } from '@/types/product';

const product = (id: string, name: string, description: string | null = null): MenuProduct => ({ id, name, description, categoryId: 'c', brandId: 'b', price: 100, discountedPrice: null, imageUrl: null, currency: 'TRY', currencySymbol: '₺' });
const menu: MenuCategory[] = [
  { id: 'c1', name: 'Pizzalar', description: null, products: [product('p1', 'Margherita', 'Domates, mozzarella'), product('p2', 'Sucuklu Pizza')] },
  { id: 'c2', name: 'Tatlılar', description: null, products: [product('p3', 'Sütlaç', 'Fırında')] },
];

describe('searchMenu', () => {
  it('matches the name without caring about case', () => {
    expect(searchMenu(menu, 'MARG').flatMap((c) => c.products.map((p) => p.id))).toEqual(['p1']);
  });
  it('ignores accents in both directions', () => {
    expect(searchMenu(menu, 'sutlac')[0].products[0].id).toBe('p3');
    expect(searchMenu(menu, 'Fırın')[0].products[0].id).toBe('p3');
    expect(searchMenu(menu, 'firin')[0].products[0].id).toBe('p3');
  });
  it('matches the description too', () => {
    expect(searchMenu(menu, 'mozza').map((c) => c.id)).toEqual(['c1']);
  });
  it('drops categories without a match and returns nothing when nothing matches', () => {
    expect(searchMenu(menu, 'pizza').map((c) => c.id)).toEqual(['c1']);
    expect(searchMenu(menu, 'xyz')).toEqual([]);
  });
  it('returns the whole menu for a blank query', () => {
    expect(searchMenu(menu, '  ')).toBe(menu);
  });
});
