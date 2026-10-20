import { discountedProducts, discountPercent, popularProducts } from '@/lib/menu-picks';
import type { MenuCategory, MenuProduct } from '@/types/product';

const product = (id: string, extra: Partial<MenuProduct> = {}): MenuProduct => ({ id, name: id, description: null, categoryId: 'c', brandId: 'b', price: 200, discountedPrice: null, imageUrl: null, currency: 'TRY', currencySymbol: '₺', ...extra });
const cat = (products: MenuProduct[]): MenuCategory[] => [{ id: 'c', name: 'C', description: null, products }];

describe('popularProducts', () => {
  it('uses the bestseller-tagged products as they are', () => {
    const result = popularProducts(cat([product('a'), product('b', { tags: ['spicy', 'bestseller'] }), product('c', { tags: ['BestSeller'] })]));
    expect(result.products.map((p) => p.id)).toEqual(['b', 'c']);
    expect(result.mocked).toBe(false);
  });
  it('falls back to the first six products and says so when nothing is tagged', () => {
    const result = popularProducts(cat(Array.from({ length: 9 }, (_, i) => product(`p${i}`))));
    expect(result.products.map((p) => p.id)).toEqual(['p0', 'p1', 'p2', 'p3', 'p4', 'p5']);
    expect(result.mocked).toBe(true);
  });
});

describe('discounts', () => {
  it('lists only products whose sale price is lower', () => {
    const menu = cat([product('a'), product('b', { discountedPrice: 170 }), product('c', { discountedPrice: 200 }), product('d', { discountedPrice: 250 })]);
    expect(discountedProducts(menu).map((p) => p.id)).toEqual(['b']);
  });
  it('computes the rounded percent off, zero when there is no discount', () => {
    expect(discountPercent(product('a', { discountedPrice: 170 }))).toBe(15);
    expect(discountPercent(product('b', { discountedPrice: 180 }))).toBe(10);
    expect(discountPercent(product('c'))).toBe(0);
  });
});
