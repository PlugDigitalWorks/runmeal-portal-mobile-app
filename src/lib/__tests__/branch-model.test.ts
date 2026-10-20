import { formatDistance, fulfillmentOf, isOpenNow, mapsUrl, nextOpening, paymentMethodsFor, settingsOf, sortForHome, todayHours } from '@/lib/branch-model';
import type { Branch, BusinessHours } from '@/types/branch';

// Tuesday 2026-10-20 14:30 local time
const tue1430 = new Date(2026, 9, 20, 14, 30);
const hours: BusinessHours = {
  tuesday: { isOpen: true, timeSlots: [{ open: '09:00', close: '13:00' }, { open: '15:00', close: '22:00' }] },
  wednesday: { isOpen: false, timeSlots: [] },
};

describe('isOpenNow', () => {
  it('is closed between slots and open inside one', () => {
    expect(isOpenNow(hours, tue1430)).toBe(false);
    expect(isOpenNow(hours, new Date(2026, 9, 20, 16, 0))).toBe(true);
  });
  it('treats an open day without slots as open all day (staging data)', () => {
    expect(isOpenNow({ tuesday: { isOpen: true, timeSlots: [] } }, tue1430)).toBe(true);
  });
  it('treats missing hours as open', () => {
    expect(isOpenNow(undefined, tue1430)).toBe(true);
  });
  it('handles slots past midnight', () => {
    expect(isOpenNow({ tuesday: { isOpen: true, timeSlots: [{ open: '18:00', close: '02:00' }] } }, new Date(2026, 9, 20, 23, 0))).toBe(true);
  });
});

it('nextOpening finds the next slot today', () => {
  expect(nextOpening(hours, tue1430)).toBe('15:00');
});

it('sorts open branches first, then by distance', () => {
  const b = (id: string, distanceM: number, open: boolean) =>
    ({ id, distanceM, business_hour: { tuesday: { isOpen: open, timeSlots: [] } } }) as unknown as Branch;
  expect(sortForHome([b('far', 900, true), b('closed', 100, false), b('near', 200, true)], tue1430).map((x) => x.id)).toEqual(['near', 'far', 'closed']);
});

it('formats distance', () => {
  expect(formatDistance(681.9, 'tr')).toBe('680 m');
  expect(formatDistance(1221.7, 'tr')).toBe('1,2 km');
  expect(formatDistance(1221.7, 'en')).toBe('1.2 km');
  expect(formatDistance(null, 'tr')).toBe('');
});

describe('paymentMethodsFor', () => {
  it('offers all three methods when the branch defines nothing (or staging\'s empty arrays)', () => {
    expect(paymentMethodsFor({})).toEqual(['ONLINE_CARD', 'CARD_ON_DELIVERY', 'CASH']);
    expect(paymentMethodsFor({ payment_settings: { onlineMethods: [], offlineMethods: [] } })).toEqual(['ONLINE_CARD', 'CARD_ON_DELIVERY', 'CASH']);
  });
  it('drops a method the branch switched off', () => {
    const payment_settings = { onlineMethods: { card: { isActive: false } }, offlineMethods: { cash: { isActive: true }, cardOnDelivery: { isActive: false } } };
    expect(paymentMethodsFor({ payment_settings })).toEqual(['CASH']);
  });
});

describe('fulfillmentOf / settingsOf', () => {
  it('lists only what the branch enables, scheduled variants included', () => {
    expect(fulfillmentOf({ order_type_settings: { delivery: { isActive: true }, pickup: { isActive: false } } })).toEqual(['delivery']);
    expect(fulfillmentOf({ order_type_settings: { scheduledPickup: { isActive: true } } })).toEqual(['pickup']);
    expect(fulfillmentOf({ order_type_settings: { delivery: { isActive: true }, pickup: { isActive: true } } })).toEqual(['delivery', 'pickup']);
    expect(fulfillmentOf({})).toEqual([]);
  });
  it('reads the detail response\'s nested order-type settings', () => {
    const detail = { parameters: { order_type_settings: { pickup: { isActive: true } } } } as never;
    expect(fulfillmentOf(settingsOf(detail))).toEqual(['pickup']);
  });
});

it('todayHours joins the slots of today and is null for closed days or no slots', () => {
  expect(todayHours(hours, tue1430)).toBe('09:00–13:00, 15:00–22:00');
  expect(todayHours(hours, new Date(2026, 9, 21, 12, 0))).toBeNull();
  expect(todayHours(undefined, tue1430)).toBeNull();
});

describe('mapsUrl', () => {
  const pin = { name: 'Kadıköy Şube', addressText: 'Moda Cd. 10', locationGeog: { type: 'Point' as const, coordinates: [29.02, 40.99] as [number, number] } };
  it('points at the coordinates (lat first) in the platform\'s own maps app', () => {
    expect(mapsUrl(pin, 'ios')).toBe('https://maps.apple.com/?ll=40.99,29.02&q=Kad%C4%B1k%C3%B6y%20%C5%9Eube');
    expect(mapsUrl(pin, 'android')).toBe('https://www.google.com/maps/search/?api=1&query=40.99,29.02');
  });
  it('falls back to the address text without coordinates', () => {
    expect(mapsUrl({ ...pin, locationGeog: null }, 'android')).toBe('https://www.google.com/maps/search/?api=1&query=Moda%20Cd.%2010');
  });
});
