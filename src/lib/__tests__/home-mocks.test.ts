import {
  branchPromos,
  campaignById,
  dealBranches,
  CAMPAIGNS,
  chainsOf,
  cuisinePhoto,
  hasPlusBadge,
  isSponsored,
  mockDelivery,
  mockMinBasket,
  promoAmount,
  mockRating,
  mockRatingCount,
  photoUrl,
  PROMO_KEYS,
  pickedForYou,
  topRatedBranches,
} from '@/mocks/home-mocks';
import { CATEGORY_IDS } from '@/lib/categories';
import type { Branch } from '@/types/branch';

const branch = (id: string, name: string, extra: Partial<Branch> = {}): Branch => ({
  id,
  name,
  slug: id,
  addressText: null,
  logoUrl: null,
  bannerUrls: null,
  locationGeog: null,
  currency: 'TRY',
  currencySymbol: '₺',
  distanceM: 1000,
  ...extra,
});
const ids = (list: Branch[]) => list.map((b) => b.id);
const many = Array.from({ length: 30 }, (_, i) => branch(`branch-${i}`, `Place ${i}`));

describe('mock rating and review count', () => {
  it('gives the same values for the same id', () => {
    expect(mockRating('abc')).toBe(mockRating('abc'));
    expect(mockRatingCount('abc')).toBe(mockRatingCount('abc'));
  });

  it('stays within bounds across many ids', () => {
    for (const { id } of many) {
      const rating = mockRating(id);
      expect(rating).toBeGreaterThanOrEqual(3.8);
      expect(rating).toBeLessThanOrEqual(4.9);
      expect(Math.round(rating * 10) / 10).toBe(rating);
      const count = mockRatingCount(id);
      expect(count).toBeGreaterThanOrEqual(40);
      expect(count).toBeLessThanOrEqual(2500);
    }
  });

  it('varies between ids', () => {
    expect(new Set(many.map((b) => mockRating(b.id))).size).toBeGreaterThan(3);
  });
});

describe('mock delivery time', () => {
  it('is a five-minute window that grows with the distance', () => {
    expect(mockDelivery(1000)).toEqual({ from: 15, to: 20 });
    expect(mockDelivery(3000)).toEqual({ from: 30, to: 35 });
    expect(mockDelivery(100).from).toBeGreaterThanOrEqual(10);
  });

  it('assumes a middling distance when it is unknown', () => {
    expect(mockDelivery(null)).toEqual(mockDelivery(1500));
  });
});

describe('picks', () => {
  it('shuffles the same way every time and caps at eight', () => {
    const first = pickedForYou(many);
    expect(first).toHaveLength(8);
    expect(ids(pickedForYou([...many].reverse()))).toEqual(ids(first));
  });

  it('orders by mock rating, highest first', () => {
    const top = topRatedBranches(many);
    expect(top).toHaveLength(8);
    for (let i = 1; i < top.length; i++) expect(mockRating(top[i - 1].id)).toBeGreaterThanOrEqual(mockRating(top[i].id));
  });
});

describe('chainsOf', () => {
  const list = [
    branch('a', 'Pizza House #023', { brandSlug: 'pizza-house', distanceM: 900, logoUrl: 'logo.png' }),
    branch('b', 'Pizza House - Kadıköy', { brandSlug: 'pizza-house', distanceM: 300 }),
    branch('c', 'Pizza House Moda', { brandSlug: 'pizza-house', distanceM: 700 }),
    branch('d', 'Solo Cafe', { brandSlug: 'solo-cafe' }),
    branch('e', 'No Brand'),
    branch('f', 'Alpha One', { brandSlug: 'alpha-one' }),
    branch('g', 'Alpha Two', { brandSlug: 'alpha-one' }),
  ];

  it('groups branches of one brand, drops singles and unbranded rows', () => {
    const chains = chainsOf(list);
    expect(chains.map((c) => c.slug)).toEqual(['pizza-house', 'alpha-one']);
    expect(chains[0]).toMatchObject({ branchCount: 3, logoUrl: 'logo.png' });
    expect(chains[0].nearest.id).toBe('b');
  });

  it('names the chain by the words its branches share, else by the slug', () => {
    const [pizza, alpha] = chainsOf(list);
    expect(pizza.name).toBe('Pizza House');
    expect(alpha.name).toBe('Alpha');
    expect(chainsOf([branch('x', 'Alpha One', { brandSlug: 'zed-bar' }), branch('y', 'Beta Two', { brandSlug: 'zed-bar' })])[0].name).toBe('Zed Bar');
  });
});

it('has five campaigns that can be found by id', () => {
  expect(CAMPAIGNS).toHaveLength(5);
  expect(campaignById('pizza2for1')?.id).toBe('pizza2for1');
  expect(campaignById('nope')).toBeUndefined();
});

describe('promo strips', () => {
  const sample = Array.from({ length: 400 }, (_, i) => `branch-${i}`);

  it('gives the same strips for the same id, zero to three distinct known ones', () => {
    for (const id of sample) {
      const promos = branchPromos(id);
      expect(branchPromos(id)).toEqual(promos);
      expect(promos.length).toBeLessThanOrEqual(3);
      expect(new Set(promos).size).toBe(promos.length);
      for (const key of promos) expect(PROMO_KEYS).toContain(key);
    }
  });

  it('leaves roughly a third of the branches without a strip', () => {
    const none = sample.filter((id) => branchPromos(id).length === 0).length / sample.length;
    expect(none).toBeGreaterThan(0.25);
    expect(none).toBeLessThan(0.45);
  });

  it('offers the Runmeal+ badge only on branches that have a strip, on about half of them', () => {
    const withPromo = sample.filter((id) => branchPromos(id).length > 0);
    expect(sample.filter((id) => hasPlusBadge(id) && branchPromos(id).length === 0)).toEqual([]);
    const plus = withPromo.filter(hasPlusBadge).length / withPromo.length;
    expect(plus).toBeGreaterThan(0.35);
    expect(plus).toBeLessThan(0.65);
  });
});

describe('sponsored and minimum basket', () => {
  const sample = Array.from({ length: 400 }, (_, i) => `branch-${i}`);

  it('sponsors about a quarter of the branches, always the same ones', () => {
    const share = sample.filter(isSponsored).length / sample.length;
    expect(share).toBeGreaterThan(0.18);
    expect(share).toBeLessThan(0.32);
    expect(sample.filter(isSponsored)).toEqual(sample.filter(isSponsored));
  });

  it('scales the invented minimum basket to the currency: 10 to 30 for pounds, euros and dollars', () => {
    for (const id of sample) {
      for (const currency of ['GBP', 'EUR', 'USD']) {
        const min = mockMinBasket(id, currency);
        expect(min).toBeGreaterThanOrEqual(10);
        expect(min).toBeLessThanOrEqual(30);
      }
    }
  });

  it('gives promo amounts per currency and none for the amount-free promo', () => {
    expect(promoAmount('firstFive', 'TRY')).toBe(200);
    expect(promoAmount('firstFive', 'GBP')).toBe(20);
    expect(promoAmount('bigBoy', 'TRY')).toBeUndefined();
  });

  it('invents a minimum basket from 150 to 500 in fifties', () => {
    for (const id of sample) {
      const min = mockMinBasket(id);
      expect(min).toBeGreaterThanOrEqual(150);
      expect(min).toBeLessThanOrEqual(500);
      expect(min % 50).toBe(0);
    }
  });
});

describe('photos', () => {
  it('builds the placeholder service url from the size and seed', () => {
    expect(photoUrl(12, 640, 480)).toBe('https://static.photos/food/640x480/12');
  });

  it('has a distinct photo for every cuisine tile', () => {
    const urls = CATEGORY_IDS.map(cuisinePhoto);
    for (const url of urls) expect(url).toMatch(/^https:\/\/static\.photos\/food\/240x240\/\d+$/);
    expect(new Set(urls).size).toBe(CATEGORY_IDS.length);
  });

  it('gives every campaign the photos its layout needs', () => {
    for (const c of CAMPAIGNS) expect(c.photos).toHaveLength(c.layout === 'collage' ? 4 : 1);
  });
});

describe('dealBranches', () => {
  const sample = Array.from({ length: 40 }, (_, i) => branch(`deal-${i}`, `Place ${i}`, { distanceM: 3000 - i * 50 }));

  it('keeps only branches with promo strips, most strips first, then nearest', () => {
    const deals = dealBranches(sample);
    expect(deals.length).toBeGreaterThan(0);
    expect(deals.length).toBeLessThan(sample.length);
    for (const b of deals) expect(branchPromos(b.id).length).toBeGreaterThan(0);
    for (let i = 1; i < deals.length; i++) {
      const [a, b] = [deals[i - 1], deals[i]];
      const diff = branchPromos(b.id).length - branchPromos(a.id).length;
      expect(diff <= 0).toBe(true);
      if (diff === 0) expect(a.distanceM!).toBeLessThanOrEqual(b.distanceM!);
    }
  });

  it('puts an unknown distance last among equals', () => {
    const id = sample.find((b) => branchPromos(b.id).length > 0)!.id;
    const twin = sample.filter((b) => b.id !== id && branchPromos(b.id).length === branchPromos(id).length)[0];
    const out = dealBranches([{ ...twin, distanceM: null }, branch(id, 'x', { distanceM: 9000 })]);
    expect(out[0].id).toBe(id);
  });
});

it('lets a chain use a branch banner as its story picture', () => {
  const chains = chainsOf([
    branch('a', 'Alpha One', { brandSlug: 'alpha', bannerUrls: ['https://img/banner.jpg'] }),
    branch('b', 'Alpha Two', { brandSlug: 'alpha' }),
  ]);
  expect(chains[0]).toMatchObject({ logoUrl: null, bannerUrl: 'https://img/banner.jpg' });
});
