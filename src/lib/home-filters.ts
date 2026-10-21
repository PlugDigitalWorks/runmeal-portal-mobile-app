import type { Branch } from '@/types/branch';
import { fulfillmentOf, isOpenNow, settingsOf, sortForHome } from './branch-model';
import { branchMatchesCategory, type CategoryId } from './categories';

/** `topRated` and `fastest` are mock-backed (the API has no rating or delivery time); they only exist while mocks are shown. */
export type HomeSort = 'recommended' | 'nearest' | 'topRated' | 'fastest';
/** `topRated` (4.0+ stars) is mock-backed and optional for the same reason. */
export type HomeFilters = { openNow: boolean; delivery: boolean; pickup: boolean; topRated?: boolean };

export const DEFAULT_SORT: HomeSort = 'recommended';
export const NO_FILTERS: HomeFilters = { openNow: false, delivery: false, pickup: false, topRated: false };

/** Value generators for the mock sort and filter options; passed in so this file never imports the mocks. */
export type MockValues = { rating: (branch: Branch) => number; etaMinutes: (branch: Branch) => number };

/** How many switches are on: the number shown on the Filter button. */
export const activeFilterCount = (filters: HomeFilters): number => Object.values(filters).filter(Boolean).length;

const distance = (b: Branch) => b.distanceM ?? Infinity;

function sortBranches(branches: Branch[], sort: HomeSort, now: Date, mock?: MockValues): Branch[] {
  if (sort === 'nearest') return [...branches].sort((a, b) => distance(a) - distance(b));
  // Without generators the mock sorts fall back to the default instead of showing an unlabelled order.
  if (sort === 'topRated' && mock) return [...branches].sort((a, b) => mock.rating(b) - mock.rating(a) || distance(a) - distance(b));
  if (sort === 'fastest' && mock) return [...branches].sort((a, b) => mock.etaMinutes(a) - mock.etaMinutes(b) || distance(a) - distance(b));
  return sortForHome(branches, now);
}

/**
 * Sort, switches and cuisine applied to the nearby list, in that order. Settings the API did
 * not send count as "not offered": a filter never lets through a branch it cannot vouch for.
 */
export function applyHomeView(
  branches: Branch[],
  sort: HomeSort,
  filters: HomeFilters,
  category: CategoryId | null,
  menuTexts: Record<string, string> = {},
  now: Date = new Date(),
  mock?: MockValues,
): Branch[] {
  return sortBranches(branches, sort, now, mock).filter((b) => {
    const fulfillment = fulfillmentOf(settingsOf(b));
    if (filters.openNow && !isOpenNow(b.business_hour, now)) return false;
    if (filters.delivery && !fulfillment.includes('delivery')) return false;
    if (filters.pickup && !fulfillment.includes('pickup')) return false;
    if (filters.topRated && mock && mock.rating(b) < 4) return false;
    return !category || branchMatchesCategory(b, category, menuTexts[b.id]);
  });
}
