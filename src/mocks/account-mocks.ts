/**
 * Gösterim amaçlı, API'de karşılığı yok (docs/BACKEND_REQUESTS.md).
 * The account hub's saved cards, discount coupons and notification switches. Screens import it only
 * while `SHOW_MOCKS` is on and always label what it feeds with "Mock".
 */
import type { Offer } from '@/mocks/restaurant-mocks';

export type MockCard = { id: string; brand: 'Visa' | 'Mastercard'; last4: string; color: string; isDefault: boolean };

/** Two sample cards; only the brand, last four digits and a colour exist, never a real number. */
export const MOCK_CARDS: MockCard[] = [
  { id: 'visa-4242', brand: 'Visa', last4: '4242', color: '#1A1F71', isDefault: true },
  { id: 'mc-5454', brand: 'Mastercard', last4: '5454', color: '#3B3B4F', isDefault: false },
];

/** Coupons in the same ticket shape as the restaurant page (texts under `restaurant.coupon.*`). */
export const MOCK_COUPONS: Offer[] = [
  { id: 'account-plus', kind: 'amount', value: 175, textKey: 'restaurant.coupon.plus', minBasket: 500, endsOn: '2026-10-31' },
  { id: 'account-weekend', kind: 'percent', value: 24, textKey: 'restaurant.coupon.weekend', minBasket: 0, endsOn: '2026-11-15' },
  { id: 'account-first', kind: 'amount', value: 200, textKey: 'restaurant.coupon.first', minBasket: 400, endsOn: '2026-11-30' },
];

export const NOTIF_KEYS = ['campaigns', 'orderStatus', 'newsletter', 'sms'] as const;
export type NotifKey = (typeof NOTIF_KEYS)[number];
export type NotifPrefs = Record<NotifKey, boolean>;

export const DEFAULT_NOTIF_PREFS: NotifPrefs = { campaigns: true, orderStatus: true, newsletter: false, sms: false };
