import { branchPromos } from '@/mocks/home-mocks';
import { mockCartReward, mockOffers, mockPrep, mockProductLike, mockReviews, REVIEW_TEXT_COUNT, restaurantRating } from '@/mocks/restaurant-mocks';

const ids = Array.from({ length: 40 }, (_, i) => `branch-${i}`);

describe('mockOffers', () => {
  it('is stable for a branch and gives 2 to 3 coupons after the home strips', () => {
    for (const id of ids) {
      const offers = mockOffers(id, 'TRY');
      expect(mockOffers(id, 'TRY')).toEqual(offers);
      const strips = offers.filter((o) => o.kind === 'promo');
      expect(strips.map((o) => o.promoKey)).toEqual(branchPromos(id));
      // The strips lead the row; what follows are the coupons.
      expect(offers.slice(0, strips.length)).toEqual(strips);
      expect(offers.length - strips.length).toBeGreaterThanOrEqual(2);
      expect(offers.length - strips.length).toBeLessThanOrEqual(3);
    }
  });
  it('drops the strips while the branch is closed, like the home card, but keeps the coupons', () => {
    const withStrips = ids.find((id) => branchPromos(id).length > 0) as string;
    expect(mockOffers(withStrips, 'TRY', false).some((o) => o.kind === 'promo')).toBe(false);
    expect(mockOffers(withStrips, 'TRY', false).length).toBeGreaterThanOrEqual(2);
  });
  it('picks distinct coupons and scales the amounts to the branch currency', () => {
    const coupons = mockOffers('br1', 'TRY', false);
    expect(new Set(coupons.map((o) => o.id)).size).toBe(coupons.length);
    const eur = mockOffers('br1', 'EUR', false);
    const amount = (list: typeof coupons) => list.filter((o) => o.kind === 'amount').map((o) => o.value);
    amount(coupons).forEach((v, i) => expect(amount(eur)[i]).toBeLessThan(v));
  });
  it('ends every coupon on a fixed date', () => {
    for (const offer of mockOffers('br1', 'TRY', false)) expect(offer.endsOn).toMatch(/^2026-\d\d-\d\d$/);
  });
});

it('restaurantRating matches what the home card shows for the same branch', () => {
  const { rating, count } = restaurantRating('br1');
  expect(rating).toBeGreaterThanOrEqual(3.8);
  expect(rating).toBeLessThanOrEqual(4.9);
  expect(count).toBeGreaterThanOrEqual(40);
  expect(restaurantRating('br1')).toEqual({ rating, count });
});

it('mockPrep is a five-minute window starting at 10, 15 or 20', () => {
  for (const id of ids) {
    const { from, to } = mockPrep(id);
    expect([10, 15, 20]).toContain(from);
    expect(to).toBe(from + 5);
  }
});

describe('mockProductLike', () => {
  it('is deterministic and covers about half of the products', () => {
    const products = Array.from({ length: 200 }, (_, i) => `product-${i}`);
    const liked = products.filter((id) => mockProductLike(id) != null);
    expect(liked.length).toBeGreaterThan(70);
    expect(liked.length).toBeLessThan(130);
    for (const id of liked) {
      const like = mockProductLike(id)!;
      expect(like).toEqual(mockProductLike(id));
      expect(like.percent).toBeGreaterThanOrEqual(60);
      expect(like.percent).toBeLessThanOrEqual(98);
      expect(like.count).toBeGreaterThanOrEqual(10);
    }
  });
});

it('mockCartReward sets a stable target above the reward, in the branch currency', () => {
  for (const id of ids) {
    const lira = mockCartReward(id, 'TRY');
    expect(lira).toEqual(mockCartReward(id, 'TRY'));
    expect(lira.target).toBeGreaterThanOrEqual(500);
    expect(lira.target).toBeLessThanOrEqual(800);
    expect(lira.reward).toBe(150);
    expect(mockCartReward(id, 'EUR').target).toBeLessThan(lira.target);
  }
});

it('mockReviews gives three distinct, stable reviews', () => {
  for (const id of ids) {
    const reviews = mockReviews(id);
    expect(reviews).toHaveLength(3);
    expect(mockReviews(id)).toEqual(reviews);
    expect(new Set(reviews.map((r) => r.author)).size).toBe(3);
    expect(new Set(reviews.map((r) => r.textIndex)).size).toBe(3);
    for (const r of reviews) {
      expect(r.textIndex).toBeLessThan(REVIEW_TEXT_COUNT);
      expect(r.rating).toBeGreaterThanOrEqual(4);
    }
    expect(reviews.map((r) => r.daysAgo)).toEqual([...reviews.map((r) => r.daysAgo)].sort((a, b) => a - b));
  }
});
