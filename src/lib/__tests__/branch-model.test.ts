import { formatDistance, isOpenNow, nextOpening, sortForHome } from '@/lib/branch-model';
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
