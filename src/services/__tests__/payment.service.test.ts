import type { InternalAxiosRequestConfig } from 'axios';
import { api } from '@/lib/api';
import { getCreditBalance } from '@/services/loyalty.service';
import { initializePayment, isPaid, waitForPayment } from '@/services/payment.service';

const reply = (data: unknown, config: InternalAxiosRequestConfig) => ({ data: { status: true, message: 'Success', data }, status: 200, statusText: 'OK', headers: {}, config });

afterEach(() => {
  jest.useRealTimers();
});

it('sends the portal origin so the provider returns to /payment/callback', async () => {
  let seen: { headers: Record<string, unknown>; data: unknown; url?: string } | null = null;
  api.defaults.adapter = async (config) => {
    seen = { headers: { ...config.headers }, data: JSON.parse(config.data), url: config.url };
    return reply({ paymentId: 'p1', paymentUrl: 'https://pay' }, config);
  };
  const result = await initializePayment({ cartId: 'c1', branchId: 'b1', brandId: 'r1', paymentMethod: 'ONLINE_CARD', orderType: 'DELIVERY', note: ' kapıyı çalma ' });
  expect(result.paymentUrl).toBe('https://pay');
  expect(seen!.url).toBe('/payments/initialize');
  expect(seen!.headers).toMatchObject({ Origin: 'https://staging-portalfe.runmeal.com', 'x-branch-id': 'b1', 'x-brand-id': 'r1' });
  expect(seen!.data).toEqual({ cartId: 'c1', paymentMethod: 'ONLINE_CARD', orderType: 'DELIVERY', creditUsedAmount: 0, note: 'kapıyı çalma' });
});

it('sends the slot and the credit when there are any', async () => {
  let body: unknown = null;
  api.defaults.adapter = async (config) => {
    body = JSON.parse(config.data);
    return reply({ paymentId: 'p1', orderId: 'o1' }, config);
  };
  await initializePayment({ cartId: 'c1', branchId: 'b1', brandId: 'r1', paymentMethod: 'CASH', orderType: 'SCHEDULED_PICKUP', scheduledFor: 'slot-1', creditUsedAmount: 12.5 });
  expect(body).toEqual({ cartId: 'c1', paymentMethod: 'CASH', orderType: 'SCHEDULED_PICKUP', scheduledFor: 'slot-1', creditUsedAmount: 12.5 });
});

it('polls until the payment settles', async () => {
  jest.useFakeTimers();
  const statuses = ['PENDING', 'PENDING', 'SUCCESS'];
  api.defaults.adapter = async (config) => reply({ id: 'p1', status: statuses.shift(), orderId: 'o1' }, config);
  const done = waitForPayment('p1', { tries: 5, delayMs: 1500 });
  await jest.advanceTimersByTimeAsync(3000);
  const record = await done;
  expect(record.status).toBe('SUCCESS');
  expect(isPaid(record)).toBe(true);
});

it('gives up after the last try and returns the unsettled record', async () => {
  jest.useFakeTimers();
  let reads = 0;
  api.defaults.adapter = async (config) => {
    reads += 1;
    return reply({ id: 'p1', status: 'PENDING', orderId: null }, config);
  };
  const done = waitForPayment('p1', { tries: 3, delayMs: 1000 });
  await jest.advanceTimersByTimeAsync(2000);
  const record = await done;
  expect(reads).toBe(3);
  expect(isPaid(record)).toBe(false);
});

it('reads the credit balance, zero when the call has none', async () => {
  api.defaults.adapter = async (config) => reply({ balance: 42.5 }, config);
  expect(await getCreditBalance()).toBe(42.5);
  api.defaults.adapter = async (config) => reply(null, config);
  expect(await getCreditBalance()).toBe(0);
});
