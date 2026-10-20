import { act, screen, waitFor } from '@testing-library/react-native';
import Deals from '@/app/deals';
import { HomeViewProvider } from '@/context/HomeViewContext';
import { resetCountdown } from '@/lib/countdown';
import { branchPromos } from '@/mocks/home-mocks';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

let mockShowMocks = true;
jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useFocusEffect: (callback: () => void | (() => void)) => jest.requireActual('react').useEffect(callback, [callback]) }));
jest.mock('@/config', () => {
  const config = { ...jest.requireActual('@/config') };
  Object.defineProperty(config, 'SHOW_MOCKS', { get: () => mockShowMocks });
  return config;
});
jest.mock('@/context/LocationContext', () => ({
  useLocation: () => ({ activeAddress: { id: 'a' }, coords: { latitude: 40.99, longitude: 29.03 }, isLoading: false, selectAddress: jest.fn() }),
}));

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const hours = (isOpen: boolean) => Object.fromEntries(ALL_DAYS.map((d) => [d, { isOpen, timeSlots: [] }]));
const row = (id: string, distanceM: number, isOpen = true) =>
  ({ id, name: `Place ${id}`, slug: id, addressText: 'Kadıköy', logoUrl: null, bannerUrls: null, locationGeog: null, currency: 'TRY', currencySymbol: '₺', distanceM, business_hour: hours(isOpen) }) as never;

beforeEach(() => {
  jest.restoreAllMocks();
  mockShowMocks = true;
  jest.useFakeTimers();
  resetCountdown();
});
afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

const renderDeals = () =>
  renderWithProviders(
    <HomeViewProvider>
      <Deals />
    </HomeViewProvider>,
  );
const ids = Array.from({ length: 60 }, (_, i) => `d${i}`);
const withPromos = ids.filter((id) => branchPromos(id).length > 0);
const without = ids.filter((id) => branchPromos(id).length === 0);

it('lists only the open branches that have promo strips, most strips first then nearest, under the live countdown', async () => {
  const picked = [without[0], ...withPromos.slice(0, 6)];
  const closed = withPromos[6];
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([...picked, closed].map((id, i) => row(id, 3000 - i * 100, id !== closed)));
  await renderDeals();
  await waitFor(() => expect(screen.getAllByTestId('branch-card-name').length).toBeGreaterThan(0));
  const expected = withPromos
    .slice(0, 6)
    .map((id, i) => ({ id, n: branchPromos(id).length, d: 3000 - (i + 1) * 100 }))
    .sort((a, b) => b.n - a.n || a.d - b.d)
    .map((x) => `Place ${x.id}`);
  expect(screen.getAllByTestId('branch-card-name').map((n) => n.props.children)).toEqual(expected);
  expect(screen.getByLabelText('15 dk : 00 sn')).toBeTruthy();
  expect(screen.getByText('içinde sipariş ver, indirimlerden birini kap!')).toBeTruthy();
  await act(async () => {
    jest.advanceTimersByTime(2000);
  });
  expect(screen.getByLabelText('14 dk : 58 sn')).toBeTruthy();
});

it('has an empty state when no branch has a promo', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row(without[0], 500)]);
  await renderDeals();
  expect(await screen.findByText('Şu an kampanyalı restoran yok')).toBeTruthy();
});

it('is a not-available state with mocks off', async () => {
  mockShowMocks = false;
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row(withPromos[0], 500)]);
  await renderDeals();
  expect(screen.getByText('Fırsatlar şu an kullanılamıyor')).toBeTruthy();
  expect(screen.queryByTestId('branch-card-name')).toBeNull();
});
