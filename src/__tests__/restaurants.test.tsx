import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import Restaurants from '@/app/restaurants';
import { HomeViewProvider } from '@/context/HomeViewContext';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/context/LocationContext', () => ({
  useLocation: () => ({ activeAddress: null, coords: { latitude: 40.99, longitude: 29.03 }, isLoading: false }),
}));

const row = (id: string, name: string, distanceM: number) =>
  ({ id, name, slug: id, addressText: null, logoUrl: null, bannerUrls: null, locationGeog: null, currency: 'TRY', currencySymbol: '₺', distanceM }) as never;

// Fake timers keep the lists' cell-batching timer from firing outside act (see home.test.tsx).
beforeEach(() => jest.useFakeTimers());
afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

it('lists every nearby restaurant and shares the cuisine choice with the chips', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row('p', 'Artisan Pizza House', 900), row('b', 'Premium Burger Co', 300)]);
  await renderWithProviders(
    <HomeViewProvider>
      <Restaurants />
    </HomeViewProvider>,
  );
  const names = () => screen.getAllByTestId('branch-card-name').map((n) => n.props.children);
  await waitFor(() => expect(names()).toEqual(['Premium Burger Co', 'Artisan Pizza House']));
  await fireEvent.press(screen.getByText('Pizza'));
  expect(names()).toEqual(['Artisan Pizza House']);
  expect(screen.getByText('Sırala')).toBeTruthy();
  expect(screen.getByText('Filtrele')).toBeTruthy();
});
