import { activeFilterCount, applyHomeView, NO_FILTERS } from '../home-filters';
import type { Branch } from '@/types/branch';

const NOON = new Date('2026-10-21T12:00:00'); // a Wednesday
const hours = (isOpen: boolean) => ({ wednesday: { isOpen, timeSlots: [] } });
const branch = (id: string, name: string, distanceM: number | null, extra: Partial<Branch> = {}): Branch => ({
  id,
  name,
  slug: id,
  addressText: null,
  logoUrl: null,
  bannerUrls: null,
  locationGeog: null,
  currency: 'TRY',
  currencySymbol: '₺',
  distanceM,
  ...extra,
});
const on = { isActive: true };
const off = { isActive: false };

const closedNear = branch('c', 'Closed Cafe', 100, { business_hour: hours(false) });
const openFar = branch('f', 'Far Pizza', 2000, { business_hour: hours(true) });
const openNear = branch('n', 'Near Burger', 500, { business_hour: hours(true) });
const all = [openFar, closedNear, openNear];

const ids = (list: Branch[]) => list.map((b) => b.id);

describe('applyHomeView sort', () => {
  it('recommended puts open places first, then nearest', () => {
    expect(ids(applyHomeView(all, 'recommended', NO_FILTERS, null, {}, NOON))).toEqual(['n', 'f', 'c']);
  });

  it('nearest is distance only, open or not, with unknown distances last', () => {
    const unknown = branch('u', 'Unknown', null);
    expect(ids(applyHomeView([...all, unknown], 'nearest', NO_FILTERS, null, {}, NOON))).toEqual(['c', 'n', 'f', 'u']);
  });

  it('does not mutate its input', () => {
    const input = [...all];
    applyHomeView(input, 'nearest', NO_FILTERS, null, {}, NOON);
    expect(input).toEqual(all);
  });
});

describe('applyHomeView filters', () => {
  it('openNow drops closed branches', () => {
    expect(ids(applyHomeView(all, 'recommended', { ...NO_FILTERS, openNow: true }, null, {}, NOON))).toEqual(['n', 'f']);
  });

  it('delivery keeps branches with delivery or scheduled delivery on', () => {
    const list = [
      branch('a', 'A', 1, { order_type_settings: { delivery: on, pickup: off } }),
      branch('b', 'B', 2, { order_type_settings: { scheduledDelivery: on } }),
      branch('c', 'C', 3, { order_type_settings: { pickup: on } }),
      branch('d', 'D', 4),
    ];
    expect(ids(applyHomeView(list, 'nearest', { ...NO_FILTERS, delivery: true }, null, {}, NOON))).toEqual(['a', 'b']);
  });

  it('pickup keeps branches with pickup or scheduled pickup on', () => {
    const list = [
      branch('a', 'A', 1, { order_type_settings: { delivery: on } }),
      branch('b', 'B', 2, { order_type_settings: { scheduledPickup: on } }),
      branch('c', 'C', 3, { order_type_settings: { pickup: on } }),
    ];
    expect(ids(applyHomeView(list, 'nearest', { ...NO_FILTERS, pickup: true }, null, {}, NOON))).toEqual(['b', 'c']);
  });

  it('combines switches and the cuisine', () => {
    const list = [
      branch('p1', 'Pizza Open', 1, { business_hour: hours(true) }),
      branch('p2', 'Pizza Closed', 2, { business_hour: hours(false) }),
      branch('b1', 'Burger Open', 3, { business_hour: hours(true) }),
    ];
    expect(ids(applyHomeView(list, 'nearest', { ...NO_FILTERS, openNow: true }, 'pizza', {}, NOON))).toEqual(['p1']);
    expect(ids(applyHomeView(list, 'nearest', NO_FILTERS, 'pizza', {}, NOON))).toEqual(['p1', 'p2']);
  });

  it('uses menu text for the cuisine when the branch name says nothing', () => {
    const list = [branch('x', 'Corner Kitchen', 1)];
    expect(applyHomeView(list, 'nearest', NO_FILTERS, 'pizza', {}, NOON)).toEqual([]);
    expect(ids(applyHomeView(list, 'nearest', NO_FILTERS, 'pizza', { x: 'margherita pizza' }, NOON))).toEqual(['x']);
  });
});

it('counts the switches that are on', () => {
  expect(activeFilterCount(NO_FILTERS)).toBe(0);
  expect(activeFilterCount({ openNow: true, delivery: false, pickup: true })).toBe(2);
});

describe('mock sort and filter options', () => {
  const rating: Record<string, number> = { n: 3.9, f: 4.8, c: 4.1 };
  const mock = { rating: (b: Branch) => rating[b.id], etaMinutes: (b: Branch) => (b.distanceM ?? 0) / 100 };

  it('sorts by rating, highest first', () => {
    expect(ids(applyHomeView(all, 'topRated', NO_FILTERS, null, {}, NOON, mock))).toEqual(['f', 'c', 'n']);
  });

  it('sorts by delivery time, fastest first', () => {
    expect(ids(applyHomeView(all, 'fastest', NO_FILTERS, null, {}, NOON, mock))).toEqual(['c', 'n', 'f']);
  });

  it('keeps 4.0+ ratings only', () => {
    expect(ids(applyHomeView(all, 'nearest', { ...NO_FILTERS, topRated: true }, null, {}, NOON, mock))).toEqual(['c', 'f']);
  });

  it('ignores the mock options when no generators are given', () => {
    expect(ids(applyHomeView(all, 'topRated', { ...NO_FILTERS, topRated: true }, null, {}, NOON))).toEqual(['n', 'f', 'c']);
  });
});
