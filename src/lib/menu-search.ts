import type { MenuCategory } from '@/types/product';
import { foldText } from './text';

/**
 * "Restoranda ara": the menu narrowed to products whose name or description contains the query, ignoring case
 * and accents ("sut" finds "Sütlaç"). Categories left without a match drop out; a blank query returns the menu as is.
 */
export function searchMenu(categories: MenuCategory[], query: string): MenuCategory[] {
  const needle = foldText(query.trim());
  if (!needle) return categories;
  return categories
    .map((category) => ({ ...category, products: category.products.filter((p) => foldText(`${p.name} ${p.description ?? ''}`).includes(needle)) }))
    .filter((category) => category.products.length > 0);
}
