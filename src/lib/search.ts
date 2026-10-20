import type { Branch } from '@/types/branch';
import type { Menu, MenuProduct } from '@/types/product';
import { foldText } from './text';

export const MIN_QUERY = 2;
/** No search endpoint (docs/BACKEND_REQUESTS.md): products come from the nearest menus only. */
export const MENU_PREFETCH_LIMIT = 20;
export type ProductHit = { branch: Branch; product: MenuProduct; brandId: string };

/** 0 = text starts with the query, 1 = a word does, 2 = it appears inside, -1 = no match. */
const score = (text: string, q: string) => (text.startsWith(q) ? 0 : text.split(' ').some((w) => w.startsWith(q)) ? 1 : text.includes(q) ? 2 : -1);

export function searchBranches(query: string, branches: Branch[]): Branch[] {
  const q = foldText(query.trim());
  if (q.length < MIN_QUERY) return [];
  return branches
    .map((branch) => ({ branch, s: score(foldText(branch.name), q) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => a.s - b.s || (a.branch.distanceM ?? 0) - (b.branch.distanceM ?? 0))
    .map((x) => x.branch);
}

/** Name matches rank before description matches; ties keep the nearest-branch order of `branches`. */
export function searchProducts(query: string, branches: Branch[], menus: Record<string, Menu>, limit = 30): ProductHit[] {
  const q = foldText(query.trim());
  if (q.length < MIN_QUERY) return [];
  const hits: (ProductHit & { s: number })[] = [];
  for (const branch of branches) {
    const menu = menus[branch.id];
    if (!menu) continue;
    for (const product of menu.categories.flatMap((c) => c.products)) {
      const byName = score(foldText(product.name), q);
      const s = byName >= 0 ? byName : foldText(product.description ?? '').includes(q) ? 3 : -1;
      if (s >= 0) hits.push({ branch, product, brandId: menu.brandId, s });
    }
  }
  return hits
    .sort((a, b) => a.s - b.s)
    .slice(0, limit)
    .map(({ s: _s, ...hit }) => hit);
}
