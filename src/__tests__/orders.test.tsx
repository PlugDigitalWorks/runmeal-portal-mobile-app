import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { BackHandler } from 'react-native';
import OrderScreen from '@/app/orders/[id]';
import * as orders from '@/services/order.service';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockDismissTo = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = { id: 'o1', branchId: 'b1', brandId: 'r1' };
let mockFocused = true;
let mockScreenOptions: { headerLeft?: () => ReactNode; gestureEnabled?: boolean } = {};
jest.mock('expo-router', () => ({
  router: { dismissTo: (p: unknown) => mockDismissTo(p), back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
  useIsFocused: () => mockFocused,
  Stack: {
    Screen: ({ options }: { options: typeof mockScreenOptions }) => {
      mockScreenOptions = options;
      return null;
    },
  },
}));

const order = (status: string, extra: Record<string, unknown> = {}) =>
  ({ id: 'o1', orderNumber: 1042, status, branchId: 'b1', brandId: 'r1', currency: 'TRY', currencySymbol: '₺', createdAt: '2026-10-21T09:05:00Z', items: [], totalPrice: 100, finalPrice: 100, ...extra }) as never;

beforeEach(() => {
  jest.restoreAllMocks();
  mockParams = { id: 'o1', branchId: 'b1', brandId: 'r1' };
  mockScreenOptions = {};
  mockFocused = true;
  mockDismissTo.mockClear();
  jest.spyOn(branches, 'getBranch').mockResolvedValue({ id: 'b1', name: 'Moda Burger' } as never);
});

it('polls every 5 s and stops when delivered', async () => {
  jest.useFakeTimers();
  const spy = jest
    .spyOn(orders, 'getOrder')
    .mockResolvedValueOnce(order('PREPARING'))
    .mockResolvedValueOnce(order('DELIVERED'))
    .mockResolvedValue(order('DELIVERED'));
  await renderWithProviders(<OrderScreen />);
  await waitFor(() => expect(screen.getByText('Hazırlanıyor')).toBeTruthy());
  await act(() => jest.advanceTimersByTimeAsync(5000));
  await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
  await act(() => jest.advanceTimersByTimeAsync(15000));
  expect(spy).toHaveBeenCalledTimes(2);
  expect(spy).toHaveBeenCalledWith('o1', { branchId: 'b1', brandId: 'r1' });
  jest.useRealTimers();
});

it('does not poll forever after a failed first load', async () => {
  jest.useFakeTimers();
  const spy = jest.spyOn(orders, 'getOrder').mockRejectedValue(new Error('404'));
  await renderWithProviders(<OrderScreen />);
  await waitFor(() => expect(screen.getByText('Tekrar dene')).toBeTruthy());
  await act(() => jest.advanceTimersByTimeAsync(20000));
  expect(spy).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});

it('keeps polling after a failed refresh when it already has the order', async () => {
  jest.useFakeTimers();
  const spy = jest.spyOn(orders, 'getOrder').mockResolvedValueOnce(order('PREPARING')).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(order('READY'));
  await renderWithProviders(<OrderScreen />);
  await waitFor(() => expect(screen.getByText('Hazırlanıyor')).toBeTruthy());
  await act(() => jest.advanceTimersByTimeAsync(10000));
  expect(spy.mock.calls.length).toBeGreaterThanOrEqual(3);
  jest.useRealTimers();
});

it('does not poll while the screen is not focused', async () => {
  jest.useFakeTimers();
  mockFocused = false;
  const spy = jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PREPARING'));
  await renderWithProviders(<OrderScreen />);
  await waitFor(() => expect(screen.getByText('Hazırlanıyor')).toBeTruthy());
  await act(() => jest.advanceTimersByTimeAsync(20000));
  expect(spy).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});

it('adds the tax line so the rows add up to the total', async () => {
  jest.spyOn(orders, 'getOrder').mockResolvedValue(
    order('CONFIRMED', { totalPrice: 118, taxAmount: 18, items: [{ id: 'i1', productName: 'Pide', qty: 1, unitPrice: 100, lineTotal: 100, finalLineTotal: 100 }] }),
  );
  await renderWithProviders(<OrderScreen />);
  expect(await screen.findByText('Vergi')).toBeTruthy();
  expect(screen.getByText('Ara toplam')).toBeTruthy();
  expect(screen.getByText('₺18,00')).toBeTruthy();
  expect(screen.getByText('₺118,00')).toBeTruthy();
});

it('pulses the current step while the order is open', async () => {
  jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PREPARING'));
  await renderWithProviders(<OrderScreen />);
  await screen.findByText('Hazırlanıyor');
  expect(screen.getAllByTestId('step-active')).toHaveLength(1);
});

it('has nothing left to pulse once delivered', async () => {
  jest.spyOn(orders, 'getOrder').mockResolvedValue(order('DELIVERED'));
  await renderWithProviders(<OrderScreen />);
  await screen.findByText('Teslim edildi');
  expect(screen.queryByTestId('step-active')).toBeNull();
});

it('replaces the timeline with a cancelled box', async () => {
  jest.spyOn(orders, 'getOrder').mockResolvedValue(order('CANCELLED'));
  await renderWithProviders(<OrderScreen />);
  expect(await screen.findByText('Sipariş iptal edildi')).toBeTruthy();
  expect(screen.queryByText('Hazırlanıyor')).toBeNull();
});

it('lists the items with options and the money breakdown in the API symbol', async () => {
  jest.spyOn(orders, 'getOrder').mockResolvedValue(
    order('CONFIRMED', {
      totalPrice: 180,
      discountAmount: 20,
      items: [{ id: 'i1', productName: 'Cheeseburger', qty: 2, unitPrice: 100, lineTotal: 200, finalLineTotal: 200, options: [{ groupName: 'Sos', selections: [{ optionName: 'Acılı' }] }] }],
    }),
  );
  await renderWithProviders(<OrderScreen />);
  expect(await screen.findByText('Cheeseburger')).toBeTruthy();
  expect(screen.getByText('Acılı')).toBeTruthy();
  expect(screen.getByText('2×')).toBeTruthy();
  expect(screen.getByText('-₺20,00')).toBeTruthy();
  expect(screen.getByText('₺180,00')).toBeTruthy();
});

it('shows the placed strip once and sends back to the tabs', async () => {
  mockParams = { ...mockParams, placed: '1' };
  jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PENDING'));
  await renderWithProviders(<OrderScreen />);
  expect(await screen.findByText('Siparişin alındı')).toBeTruthy();
  expect(mockScreenOptions.gestureEnabled).toBe(false);
  await render(<>{mockScreenOptions.headerLeft?.()}</>);
  await fireEvent.press(screen.getByLabelText('Geri'));
  expect(mockDismissTo).toHaveBeenCalledWith('/(tabs)');
});

it('treats Android back like the header button after a new order', async () => {
  mockParams = { ...mockParams, placed: '1' };
  let handler: (() => boolean | null | undefined) | undefined;
  const remove = jest.fn();
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, cb) => {
    handler = () => cb(undefined as never);
    return { remove };
  });
  jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PENDING'));
  await renderWithProviders(<OrderScreen />);
  await screen.findByText('Siparişin alındı');
  expect(handler?.()).toBe(true);
  expect(mockDismissTo).toHaveBeenCalledWith('/(tabs)');
});

it('leaves Android back alone when the order was opened from the list', async () => {
  const add = jest.spyOn(BackHandler, 'addEventListener');
  jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PENDING'));
  await renderWithProviders(<OrderScreen />);
  await screen.findByText('Sipariş alındı');
  expect(add).not.toHaveBeenCalled();
});

it('shows no placed strip when opened from the list', async () => {
  jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PENDING'));
  await renderWithProviders(<OrderScreen />);
  await screen.findByText('Sipariş alındı');
  expect(screen.queryByText('Siparişin alındı')).toBeNull();
});

it('offers a retry when the order cannot be loaded', async () => {
  const spy = jest.spyOn(orders, 'getOrder').mockRejectedValueOnce(new Error('x')).mockResolvedValue(order('READY'));
  await renderWithProviders(<OrderScreen />);
  await fireEvent.press(await screen.findByText('Tekrar dene'));
  await waitFor(() => expect(screen.getByText('Hazır')).toBeTruthy());
  expect(spy).toHaveBeenCalledTimes(2);
});

describe('mock extras', () => {
  it('shows the courier card on a ready delivery and the ETA while the order is open', async () => {
    jest.spyOn(orders, 'getOrder').mockResolvedValue(order('READY', { orderType: 'DELIVERY' }));
    await renderWithProviders(<OrderScreen />);
    expect(await screen.findByText('Kurye: Ahmet Y. · 🛵 yolda')).toBeTruthy();
    expect(screen.getByText(/Tahmini varış \d{2}:\d{2} \(Mock\)/)).toBeTruthy();
  });

  it('shows the ETA on a scheduled delivery that is still being prepared, without the courier', async () => {
    jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PREPARING', { orderType: 'SCHEDULED_DELIVERY' }));
    await renderWithProviders(<OrderScreen />);
    expect(await screen.findByText(/Tahmini varış/)).toBeTruthy();
    expect(screen.queryByText(/Kurye/)).toBeNull();
  });

  it('has no courier or ETA for a ready pick-up order', async () => {
    jest.spyOn(orders, 'getOrder').mockResolvedValue(order('READY', { orderType: 'PICKUP' }));
    await renderWithProviders(<OrderScreen />);
    await screen.findByText('Hazır');
    expect(screen.queryByText(/Kurye/)).toBeNull();
    expect(screen.queryByText(/Tahmini varış/)).toBeNull();
  });

  it('has no ETA on an open pick-up order', async () => {
    jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PREPARING', { orderType: 'PICKUP' }));
    await renderWithProviders(<OrderScreen />);
    await screen.findByText('Hazırlanıyor');
    expect(screen.queryByText(/Tahmini varış/)).toBeNull();
  });

  it('has no courier before the order is ready', async () => {
    jest.spyOn(orders, 'getOrder').mockResolvedValue(order('PREPARING', { orderType: 'DELIVERY' }));
    await renderWithProviders(<OrderScreen />);
    await screen.findByText('Hazırlanıyor');
    expect(screen.queryByText(/Kurye/)).toBeNull();
  });

  it('has no courier and no ETA once delivered', async () => {
    jest.spyOn(orders, 'getOrder').mockResolvedValue(order('DELIVERED', { orderType: 'DELIVERY' }));
    await renderWithProviders(<OrderScreen />);
    await screen.findByText('Teslim edildi');
    expect(screen.queryByText(/Kurye/)).toBeNull();
    expect(screen.queryByText(/Tahmini varış/)).toBeNull();
  });
});
