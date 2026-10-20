import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import Home from '@/app/(tabs)/index';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useFocusEffect: jest.fn() }));
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ status: 'signedIn', user: { firstName: 'Ada', lastName: 'Yılmaz' } }) }));
jest.mock('@/context/LocationContext', () => ({
  useLocation: () => ({ activeAddress: { id: 'a', street: 'Moda Cd.', buildingNumber: '10', district: 'Kadıköy' }, coords: { latitude: 40.99, longitude: 29.03 }, isLoading: false, selectAddress: jest.fn() }),
}));
// The address sheet is mounted (closed) on the screen; keep it off the network.
jest.mock('@/queries/useAddresses', () => ({ useAddresses: () => ({ data: [] }) }));

const row = (id: string, name: string, distanceM: number) =>
  ({ id, name, slug: id, addressText: 'Kadıköy', logoUrl: null, bannerUrls: null, locationGeog: null, currency: 'TRY', currencySymbol: '₺', distanceM }) as never;

it('lists nearby branches nearest first and filters by category', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row('p', 'Artisan Pizza House', 900), row('b', 'Premium Burger Co', 300)]);
  await renderWithProviders(<Home />);
  await waitFor(() => expect(screen.getByText('Premium Burger Co')).toBeTruthy());
  const names = screen.getAllByTestId('branch-card-name').map((n) => n.props.children);
  expect(names).toEqual(['Premium Burger Co', 'Artisan Pizza House']);
  await fireEvent.press(screen.getByText('Pizza'));
  expect(screen.queryByText('Premium Burger Co')).toBeNull();
});

it('shows the empty state', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([]);
  await renderWithProviders(<Home />);
  await waitFor(() => expect(screen.getByText('Bu adrese henüz teslimat yapan restoran yok')).toBeTruthy());
});

it('shows retry on error', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockRejectedValue(new Error('offline'));
  await renderWithProviders(<Home />);
  await waitFor(() => expect(screen.getByText('Tekrar dene')).toBeTruthy());
});
