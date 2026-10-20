import { api } from '@/lib/api';
import { getStampCards } from '@/services/loyalty.service';
import { getMyOrders } from '@/services/order.service';

const calls: { url?: string; params?: unknown }[] = [];
let payload: unknown;
beforeEach(() => {
  calls.length = 0;
  api.defaults.adapter = async (config) => {
    calls.push({ url: config.url, params: config.params });
    return { data: { status: true, message: 'ok', data: payload }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

it('reads the stamp cards of one brand', async () => {
  payload = [{ campaignId: 'c1' }];
  expect(await getStampCards('b/1')).toEqual([{ campaignId: 'c1' }]);
  expect(calls[0].url).toBe('/loyalty/stamps/me/b%2F1');
});

it('treats a missing card list as empty', async () => {
  payload = null;
  expect(await getStampCards('b1')).toEqual([]);
});

it('asks for the most orders the API allows and accepts a bare or a paged list', async () => {
  payload = [{ id: 'o1' }];
  expect(await getMyOrders()).toEqual([{ id: 'o1' }]);
  expect(calls[0]).toEqual({ url: '/orders/customer', params: { limit: 100 } });
  payload = { data: [{ id: 'o2' }] };
  expect(await getMyOrders()).toEqual([{ id: 'o2' }]);
});
