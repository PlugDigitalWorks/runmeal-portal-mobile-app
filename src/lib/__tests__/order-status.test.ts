import { isActiveOrder, isFinal, stepIndex } from '@/lib/order-status';

it('maps statuses to steps', () => {
  expect(stepIndex('PENDING')).toBe(0);
  expect(stepIndex('preparing')).toBe(2);
  expect(stepIndex('DELIVERED')).toBe(4);
  expect(stepIndex('CANCELLED')).toBe(-1);
  expect(stepIndex('WHATEVER')).toBe(-1);
});

it('knows final and active orders', () => {
  expect(isFinal('DELIVERED')).toBe(true);
  expect(isFinal('CANCELLED')).toBe(true);
  expect(isFinal('READY')).toBe(false);
  expect(isActiveOrder('READY')).toBe(true);
  expect(isActiveOrder('DELIVERED')).toBe(false);
});
