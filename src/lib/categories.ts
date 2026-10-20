import type { Branch } from '@/types/branch';
import type { Menu } from '@/types/product';
import { foldText } from './text';

export const CATEGORY_IDS = ['coffee', 'pizza', 'burger', 'kebab', 'dessert', 'breakfast', 'healthy', 'world'] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

/** The API has no cuisine field (docs/BACKEND_REQUESTS.md), so chips match folded TR/EN keywords. */
const KEYWORDS: Record<CategoryId, string[]> = {
  coffee: ['coffee', 'kahve', 'cafe', 'kafe', 'espresso', 'latte', 'barista'],
  pizza: ['pizza', 'pizzeria'],
  burger: ['burger', 'hamburger'],
  kebab: ['kebab', 'kebap', 'doner', 'durum', 'lahmacun', 'adana', 'iskender'],
  dessert: ['dessert', 'tatli', 'baklava', 'kunefe', 'cake', 'pasta', 'waffle', 'dondurma', 'ice cream'],
  breakfast: ['breakfast', 'kahvalti', 'brunch', 'menemen', 'simit', 'borek'],
  healthy: ['salad', 'salata', 'vegan', 'healthy', 'saglikli', 'bowl', 'fit'],
  world: ['sushi', 'noodle', 'taco', 'burrito', 'asian', 'uzakdogu', 'mexican', 'italian', 'pasta', 'ramen'],
};

export function menuText(menu: Menu): string {
  return foldText(
    menu.categories.flatMap((c) => [c.name, c.description ?? '', ...c.products.flatMap((p) => [p.name, p.description ?? ''])]).join(' '),
  );
}

export function branchMatchesCategory(branch: Branch, category: CategoryId, foldedMenuText = ''): boolean {
  const haystack = `${foldText(branch.name)} ${foldText(branch.brandSlug ?? '')} ${foldedMenuText}`;
  return KEYWORDS[category].some((word) => haystack.includes(word));
}

export function availableCategories(branches: Branch[], menuTextById: Record<string, string>): CategoryId[] {
  return CATEGORY_IDS.filter((c) => branches.some((b) => branchMatchesCategory(b, c, menuTextById[b.id])));
}
