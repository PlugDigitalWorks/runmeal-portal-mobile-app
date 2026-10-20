import { fireEvent, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Orders from '@/app/(tabs)/orders';
import * as orders from '@/services/order.service';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p) } }));

const row = (id: string, status: string, extra: Record<string, unknown> = {}) =>
  ({ id, orderNumber: Number(id.slice(1)) + 1000, status, branchId: 'b1', brandId: 'r1', currency: 'TRY', currencySymbol: '₺', createdAt: '2026-10-21T09:05:00Z', totalPrice: '250', ...extra }) as never;

beforeEach(() => {
  jest.restoreAllMocks();
  mockPush.mockClear();
  jest.spyOn(branches, 'getBranch').mockResolvedValue({ id: 'b1', name: 'Moda Burger' } as never);
});

it('splits open orders from past ones and opens one with its scope', async () => {
  jest.spyOn(orders, 'getMyOrders').mockResolvedValue([row('o1', 'PREPARING'), row('o2', 'DELIVERED'), row('o3', 'CANCELLED')]);
  await renderWithProviders(<Orders />);
  expect(await screen.findByText('Aktif')).toBeTruthy();
  expect(screen.getByText('Geçmiş')).toBeTruthy();
  expect(screen.getByText('Hazırlanıyor')).toBeTruthy();
  expect(screen.getByText('Teslim edildi')).toBeTruthy();
  expect(screen.getByText('İptal edildi')).toBeTruthy();
  expect((await screen.findAllByText('Moda Burger')).length).toBe(3);
  expect(screen.getAllByText('₺250,00').length).toBe(3);
  await fireEvent.press(screen.getByTestId('order-row-o1'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: 'o1', branchId: 'b1', brandId: 'r1' } });
});

it('omits a section with no orders', async () => {
  jest.spyOn(orders, 'getMyOrders').mockResolvedValue([row('o2', 'DELIVERED')]);
  await renderWithProviders(<Orders />);
  expect(await screen.findByText('Geçmiş')).toBeTruthy();
  expect(screen.queryByText('Aktif')).toBeNull();
});

it('shows the empty state', async () => {
  jest.spyOn(orders, 'getMyOrders').mockResolvedValue([]);
  await renderWithProviders(<Orders />);
  expect(await screen.findByText('Henüz siparişin yok')).toBeTruthy();
});

it('offers a retry when the list fails', async () => {
  const spy = jest.spyOn(orders, 'getMyOrders').mockRejectedValueOnce(new Error('x')).mockResolvedValue([row('o1', 'READY')]);
  await renderWithProviders(<Orders />);
  await fireEvent.press(await screen.findByText('Tekrar dene'));
  expect(await screen.findByText('Hazır')).toBeTruthy();
  expect(spy).toHaveBeenCalledTimes(2);
});

it('says "coming soon" for the mock reorder button', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest.spyOn(orders, 'getMyOrders').mockResolvedValue([row('o2', 'DELIVERED')]);
  await renderWithProviders(<Orders />);
  await fireEvent.press(await screen.findByText('Tekrar sipariş ver (Mock)'));
  expect(alert).toHaveBeenCalledWith('Yakında (Mock)');
  expect(mockPush).not.toHaveBeenCalled();
});
