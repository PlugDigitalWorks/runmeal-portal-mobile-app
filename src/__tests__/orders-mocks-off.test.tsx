import { screen } from '@testing-library/react-native';
import OrderScreen from '@/app/orders/[id]';
import * as orders from '@/services/order.service';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

jest.mock('@/config', () => ({ ...jest.requireActual('@/config'), SHOW_MOCKS: false }));
jest.mock('expo-router', () => ({
  router: { dismissTo: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'o1', branchId: 'b1', brandId: 'r1' }),
  useIsFocused: () => true,
  Stack: { Screen: () => null },
}));

it('shows neither the courier card nor the ETA when mocks are off', async () => {
  jest.spyOn(branches, 'getBranch').mockResolvedValue({ id: 'b1', name: 'Moda Burger' } as never);
  jest
    .spyOn(orders, 'getOrder')
    .mockResolvedValue({ id: 'o1', orderNumber: 7, status: 'READY', orderType: 'DELIVERY', branchId: 'b1', brandId: 'r1', currency: 'TRY', createdAt: '2026-10-21T09:05:00Z', items: [], totalPrice: 100 } as never);
  await renderWithProviders(<OrderScreen />);
  await screen.findByText('Hazır');
  expect(screen.queryByText(/Kurye/)).toBeNull();
  expect(screen.queryByText(/Tahmini varış/)).toBeNull();
});
