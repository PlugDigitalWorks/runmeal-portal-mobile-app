/**
 * Gösterim amaçlı, API'de karşılığı yok (docs/BACKEND_REQUESTS.md).
 * Everything the home feed shows with a "(Mock)" label comes from here: campaigns, rating,
 * delivery time and the "for you" / "top rated" / chain picks. All of it is derived from the
 * branch id (or the distance), so the same branch looks the same on every launch.
 * Screens import mock data only from this file and only while `SHOW_MOCKS` is on.
 */
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
  /** First banner of any branch: the story picture when there is no logo. */
  bannerUrl: string | null;
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
        bannerUrl: list.map((b) => b.bannerUrls?.[0]).find((u): u is string => !!u) ?? null,
        branchCount: list.length,
        nearest,
      };
    })
    .sort((a, b) => b.branchCount - a.branchCount || a.slug.localeCompare(b.slug));
}

/** Placeholder food photos, the same service the staging seed uses; the seed keeps a picture stable. */
export const photoUrl = (seed: number, width: number, height: number) => `https://static.photos/food/${width}x${height}/${seed}`;

/**
 * A hash of `salt:id` run through a murmur3-style finaliser, so every trait of a branch is independent of
 * the others (FNV alone keeps the low bits tied to the id, which would correlate every small modulus).
 */
const traitOf = (id: string, salt: string, mod: number) => {
  let h = hashId(`${salt}:${id}`);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) % mod;
};

/** Texts live in i18n under `promos.<key>`. */
export const PROMO_KEYS = ['firstFive', 'twoPizzas', 'over450', 'bigBoy', 'basket300'] as const;
export type PromoKey = (typeof PROMO_KEYS)[number];

/** The orange strips on a card: none for about 35% of the branches, otherwise one to three distinct ones. */
export function branchPromos(id: string): PromoKey[] {
  if (traitOf(id, 'promo', 100) < 35) return [];
  const count = 1 + traitOf(id, 'promoCount', 3);
  const start = traitOf(id, 'promoStart', PROMO_KEYS.length);
  return Array.from({ length: count }, (_, i) => PROMO_KEYS[(start + i * 2) % PROMO_KEYS.length]);
}

/** The "Runmeal+ indirimi" badge: about half of the branches that have a promo. */
export const hasPlusBadge = (id: string) => branchPromos(id).length > 0 && traitOf(id, 'plus', 2) === 0;

/** The grey "Sponsorlu" pill: about a quarter of the branches. */
export const isSponsored = (id: string) => traitOf(id, 'sponsored', 4) === 0;

/** The "Seçkin restoran" medal next to the name: about a third of the branches. */
export const isDistinguished = (id: string) => traitOf(id, 'medal', 3) === 0;

/** 150 to 500 ₺ in fifties, for branches whose API row carries no minimum basket. */
export const mockMinBasket = (id: string) => 150 + 50 * traitOf(id, 'min', 8);

/** One food photo per cuisine tile; the keys are the category ids of lib/categories. */
export const CUISINE_PHOTO_SEEDS: Record<string, number> = { coffee: 21, pizza: 12, burger: 34, kebab: 47, dessert: 58, breakfast: 63, healthy: 75, world: 89 };
export const cuisinePhoto = (category: string) => photoUrl(CUISINE_PHOTO_SEEDS[category] ?? 1, 240, 240);

export type CampaignId = 'basket20' | 'firstOrder' | 'pizza2for1' | 'coffeeHalf' | 'freeDelivery';

/**
 * Texts live in i18n under `campaigns.items.<id>`. `collage` posters carry a bold headline beside a 2x2
 * photo grid; `single` posters lay a big amount (`headline`) and `caption` over one photo.
 */
export interface Campaign {
  id: CampaignId;
  color: string;
  layout: 'collage' | 'single';
  /** Photo seeds: four for a collage, the first one for a single-photo poster. */
  photos: number[];
}

export const CAMPAIGNS: Campaign[] = [
  { id: 'basket20', color: '#F5A623', layout: 'collage', photos: [12, 34, 47, 58] },
  { id: 'firstOrder', color: '#10192E', layout: 'single', photos: [63] },
  { id: 'pizza2for1', color: '#E28900', layout: 'collage', photos: [12, 15, 17, 19] },
  { id: 'coffeeHalf', color: '#16A34A', layout: 'single', photos: [21] },
  { id: 'freeDelivery', color: '#BE6C11', layout: 'collage', photos: [75, 89, 91, 95] },
];

/** The four photos of the hero banner above the campaigns. */
export const HERO_PHOTOS = [101, 34, 12, 47];

export const campaignById = (id: string): Campaign | undefined => CAMPAIGNS.find((c) => c.id === id);

/** The branches with at least one promo strip, most strips first, then nearest (unknown distance last). */
export function dealBranches(branches: Branch[]): Branch[] {
  return branches
    .filter((b) => branchPromos(b.id).length > 0)
    .sort((a, b) => branchPromos(b.id).length - branchPromos(a.id).length || (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity) || a.id.localeCompare(b.id));
}
