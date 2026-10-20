/**
 * Gösterim amaçlı, API'de karşılığı yok (docs/BACKEND_REQUESTS.md).
 * Everything the home feed shows with a "(Mock)" label comes from here: campaigns, rating,
 * delivery time and the "for you" / "top rated" / chain picks. All of it is derived from the
 * branch id (or the distance), so the same branch looks the same on every launch.
 * Screens import mock data only from this file and only while `SHOW_MOCKS` is on.
 */
import { Bike, Coffee, Gift, Percent, Pizza, type LucideIcon } from 'lucide-react-native';
import type { Branch } from '@/types/branch';

/** FNV-1a: a small stable string hash, so ids map to the same numbers on every device. */
export function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 3.8 to 4.9, one decimal. */
export function mockRating(id: string): number {
  return (38 + (hashId(id) % 12)) / 10;
}

/** 40 to 2500: tens below a hundred, hundreds above (shown as "120+"). */
export function mockRatingCount(id: string): number {
  const raw = 40 + (Math.imul(hashId(id), 2654435761) >>> 0) % 2461;
  return raw < 100 ? Math.round(raw / 10) * 10 : Math.round(raw / 100) * 100;
}

/** Walking the distance at roughly 6 min/km on top of 10 min of prep, as a five-minute window. */
export function mockDelivery(distanceM: number | null): { from: number; to: number } {
  const km = (distanceM ?? 1500) / 1000;
  const from = Math.max(10, Math.round((10 + Math.round(km * 6)) / 5) * 5);
  return { from, to: from + 5 };
}

/** The value generators `applyHomeView` takes for the mock sort and filter options. */
export const mockGenerators = {
  rating: (b: Branch) => mockRating(b.id),
  etaMinutes: (b: Branch) => mockDelivery(b.distanceM).from,
};

const byHash = (a: Branch, b: Branch) => hashId(a.id) - hashId(b.id) || a.id.localeCompare(b.id);

/** "For you": a stable shuffle of the nearby branches, so the row does not reorder between launches. */
export function pickedForYou(branches: Branch[], limit = 8): Branch[] {
  return [...branches].sort(byHash).slice(0, limit);
}

export function topRatedBranches(branches: Branch[], limit = 8): Branch[] {
  return [...branches].sort((a, b) => mockRating(b.id) - mockRating(a.id) || byHash(a, b)).slice(0, limit);
}

export interface Chain {
  slug: string;
  name: string;
  logoUrl: string | null;
  branchCount: number;
  /** The closest branch: where a tap on the chain goes. */
  nearest: Branch;
}

const titleCase = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

/** "Pizza House #023" and "Pizza House - Kadıköy" both belong to "Pizza House". */
const withoutSuffix = (name: string) => name.replace(/\s*[#(-].*$/, '').trim();

/** The words every branch name starts with; the API has no brand name field, so this is a guess. */
function chainName(slug: string, names: string[]): string {
  const split = names.map((n) => withoutSuffix(n).split(/\s+/));
  const common: string[] = [];
  for (let i = 0; i < split[0].length; i++) {
    if (split.every((words) => words[i]?.toLowerCase() === split[0][i].toLowerCase())) common.push(split[0][i]);
    else break;
  }
  return common.length ? common.join(' ') : titleCase(slug);
}

/** Brands with two or more nearby branches, most branches first. */
export function chainsOf(branches: Branch[]): Chain[] {
  const groups = new Map<string, Branch[]>();
  for (const b of branches) {
    if (!b.brandSlug) continue;
    groups.set(b.brandSlug, [...(groups.get(b.brandSlug) ?? []), b]);
  }
  return [...groups.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([slug, list]) => {
      const nearest = [...list].sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity))[0];
      return {
        slug,
        name: chainName(slug, list.map((b) => b.name)),
        logoUrl: list.find((b) => b.logoUrl)?.logoUrl ?? null,
        branchCount: list.length,
        nearest,
      };
    })
    .sort((a, b) => b.branchCount - a.branchCount || a.slug.localeCompare(b.slug));
}

export type CampaignId = 'basket20' | 'firstOrder' | 'pizza2for1' | 'coffeeHalf' | 'freeDelivery';

/** Texts live in i18n under `campaigns.items.<id>`. */
export interface Campaign {
  id: CampaignId;
  color: string;
  icon: LucideIcon;
}

export const CAMPAIGNS: Campaign[] = [
  { id: 'basket20', color: '#F5A623', icon: Percent },
  { id: 'firstOrder', color: '#E28900', icon: Gift },
  { id: 'pizza2for1', color: '#10192E', icon: Pizza },
  { id: 'coffeeHalf', color: '#16A34A', icon: Coffee },
  { id: 'freeDelivery', color: '#BE6C11', icon: Bike },
];

export const campaignById = (id: string): Campaign | undefined => CAMPAIGNS.find((c) => c.id === id);
