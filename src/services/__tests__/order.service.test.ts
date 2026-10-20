import { api } from '@/lib/api';
import { getOrder } from '@/services/order.service';

const calls: { url?: string; headers?: Record<string, string> }[] = [];
beforeEach(() => {
  calls.length = 0;
  api.defaults.adapter = async (config) => {
    calls.push({ url: config.url, headers: config.headers as unknown as Record<string, string> });
    return { data: { status: true, message: 'ok', data: { id: 'o/1', status: 'READY', items: [] } }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

it('reads one order under its branch and brand headers', async () => {
  expect((await getOrder('o/1', { branchId: 'b1', brandId: 'r1' })).status).toBe('READY');
  expect(calls[0].url).toBe('/orders/o%2F1');
  expect(calls[0].headers).toMatchObject({ 'x-branch-id': 'b1', 'x-brand-id': 'r1' });
});

it('leaves the brand header out when the brand is unknown', async () => {
  await getOrder('o1', { branchId: 'b1' });
  expect(calls[0].headers?.['x-brand-id']).toBeUndefined();
});
