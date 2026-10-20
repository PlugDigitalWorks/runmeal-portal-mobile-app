import type { Branch } from '@/types/branch';
import { deliveryCovered, isDelivery, isScheduled, orderHref, orderTypesFor, parsePaymentCallback, paymentMethodsForOrder, resolveOrderType } from '../checkout';

const settings = (order_type_settings: Branch['order_type_settings'], payment_settings?: Branch['payment_settings']) => ({ order_type_settings, payment_settings });

it('offers the order types the branch enables, in brandfe order', () => {
  expect(orderTypesFor(settings({ pickup: { isActive: true }, delivery: { isActive: false }, scheduledPickup: { isActive: true } }))).toEqual(['PICKUP', 'SCHEDULED_PICKUP']);
  expect(
    orderTypesFor(settings({ pickup: { isActive: true }, delivery: { isActive: true }, scheduledDelivery: { isActive: true }, scheduledPickup: { isActive: false } })),
  ).toEqual(['DELIVERY', 'SCHEDULED_DELIVERY', 'PICKUP']);
});

it('offers nothing when the branch enables nothing (what staging sends)', () => {
  expect(orderTypesFor(settings({ pickup: { isActive: false }, delivery: { isActive: false }, scheduledPickup: { isActive: false }, scheduledDelivery: { isActive: false } }))).toEqual([]);
  expect(orderTypesFor({})).toEqual([]);
});

it('offers payment methods per branch settings, card only for scheduled pickup', () => {
  const open = settings(undefined, { onlineMethods: { card: { isActive: true } }, offlineMethods: { cash: { isActive: true }, cardOnDelivery: { isActive: true } } });
  expect(paymentMethodsForOrder(open, 'PICKUP')).toEqual(['ONLINE_CARD', 'CARD_ON_DELIVERY', 'CASH']);
  expect(paymentMethodsForOrder(open, 'SCHEDULED_PICKUP')).toEqual(['ONLINE_CARD']);
  const cardOnly = settings(undefined, { onlineMethods: { card: { isActive: true } }, offlineMethods: { cash: { isActive: false }, cardOnDelivery: { isActive: false } } });
  expect(paymentMethodsForOrder(cardOnly, 'PICKUP')).toEqual(['ONLINE_CARD']);
  // Nothing defined, or staging's `[]` placeholders: every method counts as open.
  expect(paymentMethodsForOrder({}, 'DELIVERY')).toEqual(['ONLINE_CARD', 'CARD_ON_DELIVERY', 'CASH']);
  expect(paymentMethodsForOrder(settings(undefined, { onlineMethods: [], offlineMethods: [] }), 'DELIVERY')).toEqual(['ONLINE_CARD', 'CARD_ON_DELIVERY', 'CASH']);
});

it('classifies order types', () => {
  expect(isScheduled('SCHEDULED_PICKUP')).toBe(true);
  expect(isScheduled('PICKUP')).toBe(false);
  expect(isDelivery('SCHEDULED_DELIVERY')).toBe(true);
  expect(isDelivery('PICKUP')).toBe(false);
});

it('delivery is covered only when the branch is in the nearby result for that address', () => {
  expect(deliveryCovered('b1', [{ id: 'b1' }, { id: 'b2' }] as never)).toBe(true);
  expect(deliveryCovered('b9', [{ id: 'b1' }] as never)).toBe(false);
});

it('parses the portal callback URL', () => {
  expect(parsePaymentCallback('https://staging-portalfe.runmeal.com/payment/callback?status=success&paymentId=p1&orderId=o1')).toEqual({
    status: 'success',
    paymentId: 'p1',
    orderId: 'o1',
  });
  expect(parsePaymentCallback('https://staging-portalfe.runmeal.com/payment/callback?status=failure&paymentId=p1')).toEqual({ status: 'failure', paymentId: 'p1', orderId: null });
  expect(parsePaymentCallback('https://pay.iyzico.com/checkout')).toBeNull();
  expect(parsePaymentCallback('not a url')).toBeNull();
});

describe('resolveOrderType', () => {
  const types = ['DELIVERY', 'PICKUP', 'SCHEDULED_PICKUP'] as const;
  it('lands on the exact type when the branch offers it', () => {
    expect(resolveOrderType([...types], { delivery: false, scheduled: true })).toBe('SCHEDULED_PICKUP');
  });
  it('keeps the kind and changes the timing when the exact type is missing', () => {
    expect(resolveOrderType([...types], { delivery: true, scheduled: true })).toBe('DELIVERY');
  });
  it('falls back to the first type, and to null when there is none', () => {
    expect(resolveOrderType(['PICKUP'], { delivery: true, scheduled: false })).toBe('PICKUP');
    expect(resolveOrderType([...types], null)).toBe('DELIVERY');
    expect(resolveOrderType([], null)).toBeNull();
  });
});

it('builds the order route with the placed flag', () => {
  expect(orderHref({ id: 'o1', branchId: 'b1', brandId: 'r1' })).toEqual({ pathname: '/orders/[id]', params: { id: 'o1', branchId: 'b1', brandId: 'r1', placed: '1' } });
});
