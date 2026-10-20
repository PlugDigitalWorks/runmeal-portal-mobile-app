import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import Deals from '@/app/deals';
import { HomeViewProvider } from '@/context/HomeViewContext';
import { resetCountdown } from '@/lib/countdown';
import { branchPromos } from '@/mocks/home-mocks';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

let mockShowMocks = true;
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p), replace: (p: unknown) => mockReplace(p), back: () => mockBack() }, useFocusEffect: (callback: () => void | (() => void)) => jest.requireActual('react').useEffect(callback, [callback]) }));
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
  jest.clearAllMocks();
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

it('shows the flash panel, then a grid of only the open promo branches, most promos first then nearest', async () => {
  const picked = [without[0], ...withPromos.slice(0, 6)];
  const closed = withPromos[6];
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([...picked, closed].map((id, i) => row(id, 3000 - i * 100, id !== closed)));
  await renderDeals();
  await waitFor(() => expect(screen.getAllByTestId('deal-card-name').length).toBeGreaterThan(0));
  const expected = withPromos
    .slice(0, 6)
    .map((id, i) => ({ id, n: branchPromos(id).length, d: 3000 - (i + 1) * 100 }))
    .sort((a, b) => b.n - a.n || a.d - b.d)
    .map((x) => `Place ${x.id}`);
  expect(screen.getAllByTestId('deal-card-name').map((n) => n.props.children)).toEqual(expected);
  expect(screen.getByText('RUNMEAL')).toBeTruthy();
  // Four tiers in the branches' currency, whole numbers.
  for (const text of ['₺275 ve üzerine', '₺70', '₺100', '₺150', '₺200']) expect(screen.getByText(text)).toBeTruthy();
  expect(screen.getAllByText('İNDİRİM')).toHaveLength(4);
  expect(screen.getByText(`Öne çıkan restoranlar (${expected.length}) (Mock)`)).toBeTruthy();
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
  expect(screen.queryByTestId('deal-card-name')).toBeNull();
});

it('closes with the Küçült button', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row(withPromos[0], 500)]);
  await renderDeals();
  await fireEvent.press(await screen.findByLabelText('Küçült'));
  expect(mockBack).toHaveBeenCalled();
});

it('tapping a restaurant replaces the sheet with the restaurant page', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row(withPromos[0], 500)]);
  await renderDeals();
  await fireEvent.press(await screen.findByLabelText(`Place ${withPromos[0]}`));
  expect(mockReplace).toHaveBeenCalledWith({ pathname: '/restaurant/[branchId]', params: { branchId: withPromos[0] } });
  expect(mockPush).not.toHaveBeenCalled();
});

it('does not fetch anything with mocks off', async () => {
  mockShowMocks = false;
  const nearby = jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([]);
  await renderDeals();
  expect(screen.getByText('Fırsatlar şu an kullanılamıyor')).toBeTruthy();
  expect(nearby).not.toHaveBeenCalled();
});

it('scales the tiers to the branch currency', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([{ ...(row(withPromos[0], 500) as object), currency: 'GBP', currencySymbol: '£' } as never]);
  await renderDeals();
  expect(await screen.findByText('£15 ve üzerine')).toBeTruthy();
  expect(screen.getByText('£12')).toBeTruthy();
  expect(screen.queryByText(/₺/)).toBeNull();
});

it('renders one tile per promo branch in a two-column grid', async () => {
  const picked = withPromos.slice(0, 5);
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue(picked.map((id, i) => row(id, 500 + i)));
  await renderDeals();
  await waitFor(() => expect(screen.getAllByTestId('deal-card-name')).toHaveLength(5));
  expect(screen.getByText('Öne çıkan restoranlar (5) (Mock)')).toBeTruthy();
});
