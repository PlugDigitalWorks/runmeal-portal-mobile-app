import type { MenuCategory, MenuProduct } from '@/types/product';

/** The tag the API puts on a restaurant's best sellers. */
const BESTSELLER = 'bestseller';
const FALLBACK_COUNT = 6;

const all = (categories: MenuCategory[]): MenuProduct[] => categories.flatMap((c) => c.products);

/**
 * Products for the "Popular" rail: the ones tagged `bestseller`. Without any tag the API gives no popularity,
 * so the first six products stand in and `mocked` tells the screen to say so.
 */
export function popularProducts(categories: MenuCategory[]): { products: MenuProduct[]; mocked: boolean } {
  const products = all(categories);
  const tagged = products.filter((p) => p.tags?.some((tag) => tag.toLowerCase() === BESTSELLER));
  return tagged.length > 0 ? { products: tagged, mocked: false } : { products: products.slice(0, FALLBACK_COUNT), mocked: true };
}

export const isDiscounted = (p: Pick<MenuProduct, 'price' | 'discountedPrice'>): boolean => p.discountedPrice != null && Number(p.discountedPrice) < Number(p.price);

/** Products with a real discount (the sale price is below the price). */
export const discountedProducts = (categories: MenuCategory[]): MenuProduct[] => all(categories).filter(isDiscounted);

/** Whole percent off, rounded: 200 → 180 is 10. */
export function discountPercent(p: Pick<MenuProduct, 'price' | 'discountedPrice'>): number {
  const price = Number(p.price);
  return isDiscounted(p) && price > 0 ? Math.round((1 - Number(p.discountedPrice) / price) * 100) : 0;
}
