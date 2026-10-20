/**
 * Gösterim amaçlı, API'de karşılığı yok (docs/BACKEND_REQUESTS.md).
 * Everything the restaurant page shows with a "Mock" tag comes from here: coupons, review samples,
 * product likes, the pickup prep time and the cart reward bar. Like home-mocks, every value is derived
 * from an id so a restaurant looks the same on every launch. Screens import it only while `SHOW_MOCKS` is on.
 * Texts live in i18n (`restaurant.*`); this file only picks which ones and the numbers that go in them.
 */
import { branchPromos, hashId, mockRating, mockRatingCount, type PromoKey } from '@/mocks/home-mocks';

/** Same murmur3-style finaliser as home-mocks, so traits with different salts do not correlate. */
const trait = (id: string, salt: string, mod: number) => {
  let h = hashId(`${salt}:${id}`);
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) % mod;
};

/** The big figures of a restaurant's rating box: same value as on its home card. */
export const restaurantRating = (branchId: string) => ({ rating: mockRating(branchId), count: mockRatingCount(branchId) });

/** Pickup preparation window: 10–15, 15–20 or 20–25 minutes. */
export function mockPrep(branchId: string): { from: number; to: number } {
  const from = 10 + 5 * trait(branchId, 'prep', 3);
  return { from, to: from + 5 };
}

/** Whole units of the branch's own currency: lira amounts for TRY, a tenth of that for pound, euro and dollar. */
const inCurrency = (lira: number, currency: string, other: number) => (currency === 'TRY' ? lira : other);

export interface Offer {
  id: string;
  /** `amount` and `percent` show `value` on the left of the ticket; `promo` is one of the home feed's orange strips. */
  kind: 'amount' | 'percent' | 'promo';
  value: number;
  /** Key under `restaurant.coupon.*` (amount, percent) or `promos.*` (promo). */
  textKey: string;
  promoKey?: PromoKey;
  minBasket: number;
  /** ISO date the offer ends; null for strips, which have no date. */
  endsOn: string | null;
}

const END_DATES = ['2026-10-31', '2026-11-15', '2026-11-30', '2026-12-31'];

interface Template {
  key: string;
  kind: 'amount' | 'percent';
  value: (currency: string) => number;
  min: (currency: string) => number;
}
const TEMPLATES: Template[] = [
  { key: 'plus', kind: 'amount', value: (c) => inCurrency(175, c, 15), min: (c) => inCurrency(500, c, 25) },
  { key: 'weekend', kind: 'percent', value: () => 24, min: () => 0 },
  { key: 'first', kind: 'amount', value: (c) => inCurrency(200, c, 20), min: (c) => inCurrency(400, c, 20) },
  { key: 'drink', kind: 'amount', value: (c) => inCurrency(50, c, 5), min: (c) => inCurrency(250, c, 12) },
];

/**
 * The ticket row: the home feed's own strips for this branch first (so both screens agree), then two or
 * three coupons picked by the id. Strips only apply while the branch is open, as on the home card.
 */
export function mockOffers(branchId: string, currency: string, open = true): Offer[] {
  const strips: Offer[] = open
    ? branchPromos(branchId).map((promoKey) => ({ id: `promo-${promoKey}`, kind: 'promo', value: 0, textKey: `promos.${promoKey}`, promoKey, minBasket: 0, endsOn: null }))
    : [];
  const count = 2 + trait(branchId, 'couponCount', 2);
  const start = trait(branchId, 'couponStart', TEMPLATES.length);
  const coupons: Offer[] = Array.from({ length: count }, (_, i) => {
    const tpl = TEMPLATES[(start + i) % TEMPLATES.length];
    return {
      id: `coupon-${tpl.key}`,
      kind: tpl.kind,
      value: tpl.value(currency),
      textKey: `restaurant.coupon.${tpl.key}`,
      minBasket: tpl.min(currency),
      endsOn: END_DATES[(trait(branchId, 'end', END_DATES.length) + i) % END_DATES.length],
    };
  });
  return [...strips, ...coupons];
}

/** "👍 %70 beğenildi (10 değerlendirme)" for about half of the products; null for the rest. */
export function mockProductLike(productId: string): { percent: number; count: number } | null {
  if (trait(productId, 'liked', 2) !== 0) return null;
  return { percent: 60 + trait(productId, 'likedPct', 39), count: 10 + 5 * trait(productId, 'likedCount', 30) };
}

/** Basket value that earns the reward in the progress bar, and the reward itself, in the branch's currency. */
export function mockCartReward(branchId: string, currency: string): { target: number; reward: number } {
  return {
    target: currency === 'TRY' ? 500 + 50 * trait(branchId, 'goal', 7) : 25 + 5 * trait(branchId, 'goal', 7),
    reward: inCurrency(150, currency, 15),
  };
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  daysAgo: number;
  /** N of the `restaurant.reviewItem<N>` i18n keys. */
  textIndex: number;
}

const AUTHORS = ['Ayşe K.', 'Mehmet D.', 'Zeynep A.', 'Can Y.', 'Elif S.', 'Burak T.'];
export const REVIEW_TEXT_COUNT = 6;

/** Three sample reviews, distinct authors and texts, newest first. */
export function mockReviews(branchId: string): Review[] {
  const first = trait(branchId, 'reviewFirst', AUTHORS.length);
  return [0, 1, 2].map((i) => ({
    id: `review-${i}`,
    author: AUTHORS[(first + i) % AUTHORS.length],
    rating: i === 2 ? 4 : 5 - (trait(branchId, `reviewRating${i}`, 4) === 0 ? 1 : 0),
    daysAgo: 2 + i * 6 + trait(branchId, `reviewAge${i}`, 5),
    textIndex: (trait(branchId, 'reviewText', REVIEW_TEXT_COUNT) + i) % REVIEW_TEXT_COUNT,
  }));
}
