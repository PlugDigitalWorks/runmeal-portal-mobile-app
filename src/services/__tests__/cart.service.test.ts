import { api } from '@/lib/api';
import { applyPromotion, clearCart, getCurrentCart, setCartItemQty } from '@/services/cart.service';

type Call = { method?: string; url?: string; data?: unknown; headers: Record<string, unknown> };
const calls: Call[] = [];
const respond = (data: unknown) => ({ data: { status: true, message: 'Success', data }, status: 200, statusText: 'OK', headers: {} });

beforeEach(() => {
  calls.length = 0;
});

it('opens the newest active cart with its branch headers', async () => {
  api.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data, headers: { ...config.headers } });
    if (config.url === '/carts')
      return {
        ...respond([
          { id: 'old', branchId: 'b1', brandId: 'r1', isActive: true, updatedAt: '2026-10-01T00:00:00Z' },
          { id: 'new', branchId: 'b2', brandId: 'r2', isActive: true, updatedAt: '2026-10-20T00:00:00Z' },
          { id: 'off', branchId: 'b3', brandId: 'r3', isActive: false, updatedAt: '2026-10-21T00:00:00Z' },
        ]),
        config,
      };
    return { ...respond({ id: 'new', branchId: 'b2', brandId: 'r2', items: [] }), config };
  };
  const cart = await getCurrentCart();
  expect(cart?.id).toBe('new');
  expect(calls[1]).toMatchObject({ url: '/carts/new', headers: { 'x-branch-id': 'b2', 'x-brand-id': 'r2' } });
});

it('returns null with no active cart', async () => {
  api.defaults.adapter = async (config) => ({ ...respond([]), config });
  expect(await getCurrentCart()).toBeNull();
});

it('clears a cart by id in the body', async () => {
  api.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data, headers: { ...config.headers } });
    return { ...respond(null), config };
  };
  await clearCart('c1', { branchId: 'b1', brandId: 'r1' });
  expect(calls[0]).toMatchObject({ method: 'delete', url: '/carts', headers: { 'x-branch-id': 'b1' } });
  expect(JSON.parse(String(calls[0].data))).toEqual({ cartId: 'c1' });
});

it('applies an internal coupon with the order type', async () => {
  api.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data, headers: { ...config.headers } });
    return { ...respond({ id: 'c1', branchId: 'b1', brandId: 'r1' }), config };
  };
  await applyPromotion('c1', { promotionCode: 'WELCOME', orderType: 'DELIVERY' }, { branchId: 'b1', brandId: 'r1' });
  expect(calls[0]).toMatchObject({ method: 'post', url: '/carts/c1/promotions/apply', headers: { 'x-branch-id': 'b1' } });
  expect(JSON.parse(String(calls[0].data))).toEqual({ type: 'INTERNAL', promotionCode: 'WELCOME', orderType: 'DELIVERY' });
});

it('sets a line quantity even when the API answers only a message', async () => {
  api.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data, headers: { ...config.headers } });
    return { data: { message: 'Updated' }, status: 200, statusText: 'OK', headers: {}, config };
  };
  await expect(setCartItemQty('i1', 3, { branchId: 'b1', brandId: 'r1' })).resolves.toBeUndefined();
  expect(calls[0]).toMatchObject({ method: 'patch', url: '/carts/items/qty', headers: { 'x-branch-id': 'b1', 'x-brand-id': 'r1' } });
  expect(JSON.parse(calls[0].data as string)).toEqual({ itemId: 'i1', qty: 3 });
});
