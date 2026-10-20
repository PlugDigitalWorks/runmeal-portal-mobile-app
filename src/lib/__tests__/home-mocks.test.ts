import { campaignById, CAMPAIGNS, chainsOf, mockDelivery, mockRating, mockRatingCount, pickedForYou, topRatedBranches } from '@/mocks/home-mocks';
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
