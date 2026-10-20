import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import SearchScreen from '@/app/search';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p), back: jest.fn() } }));

let mockShowMocks = true;
jest.mock('@/config', () => Object.defineProperty({ ...jest.requireActual('@/config'), __esModule: true }, 'SHOW_MOCKS', { get: () => mockShowMocks, enumerable: true }));

const branch = (id: string, name: string, distanceM: number) =>
  ({ id, name, slug: id, addressText: null, logoUrl: null, bannerUrls: null, locationGeog: null, currency: 'TRY', currencySymbol: '₺', distanceM }) as never;
const branches = [branch('p', 'Artisan Pizza House', 900), branch('k', 'Köfteci Ramiz', 300)];
const margherita = { id: 'm1', categoryId: 'c', brandId: 'rp', name: 'Margherita', description: 'Domates, mozzarella', price: 200, discountedPrice: null, imageUrl: null, currency: 'TRY', currencySymbol: '₺' };
const menus = { p: { branchId: 'p', brandId: 'rp', currency: 'TRY', currencySymbol: '₺', categories: [{ id: 'c', name: 'Pizzalar', description: null, products: [margherita] }] } };

let mockIndex: { branches: unknown[]; menus: unknown; loadingMenus: boolean };
jest.mock('@/queries/useSearchIndex', () => ({ useSearchIndex: () => mockIndex }));

// Fake timers keep the list's cell-batching timer from firing outside act (see restaurants.test.tsx).
beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockShowMocks = true;
  mockIndex = { branches, menus, loadingMenus: false };
  await AsyncStorage.clear();
});
afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

const type = (text: string) => fireEvent.changeText(screen.getByPlaceholderText('Restoran veya yemek ara'), text);

it('shows the matching dish with its restaurant name', async () => {
  await renderWithProviders(<SearchScreen />);
  await type('marg');
  expect(await screen.findByText('Margherita')).toBeTruthy();
  expect(screen.getByText('Artisan Pizza House')).toBeTruthy();
  expect(screen.getByText('Ürünler')).toBeTruthy();
});

it('lists matching restaurants and opens one', async () => {
  await renderWithProviders(<SearchScreen />);
  await type('kofte');
  expect(await screen.findByText('Restoranlar')).toBeTruthy();
  await fireEvent.press(await screen.findByText('Köfteci Ramiz'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/restaurant/[branchId]', params: { branchId: 'k' } });
  await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem('rm_recent_searches')) ?? '[]')).toEqual(['kofte']));
});

it('opens the restaurant page and then the product sheet for a dish', async () => {
  await renderWithProviders(<SearchScreen />);
  await type('marg');
  await fireEvent.press(await screen.findByText('Margherita'));
  expect(mockPush).toHaveBeenNthCalledWith(1, { pathname: '/restaurant/[branchId]', params: { branchId: 'p' } });
  expect(mockPush).toHaveBeenNthCalledWith(2, { pathname: '/product/[id]', params: { id: 'm1', branchId: 'p', brandId: 'rp' } });
});

it('says so when nothing matches', async () => {
  await renderWithProviders(<SearchScreen />);
  await type('xyzq');
  expect(await screen.findByText('“xyzq” için sonuç bulunamadı')).toBeTruthy();
});

it('shows a spinner next to the dishes while menus are still being scanned', async () => {
  mockIndex = { branches, menus: {}, loadingMenus: true };
  await renderWithProviders(<SearchScreen />);
  await type('pizza');
  expect(await screen.findByText('Menüler taranıyor…')).toBeTruthy();
  expect(screen.queryByText(/için sonuç bulunamadı/)).toBeNull();
});

it('lists recent searches and the mock suggestions on an empty query', async () => {
  await AsyncStorage.setItem('rm_recent_searches', JSON.stringify(['pizza']));
  await renderWithProviders(<SearchScreen />);
  expect(await screen.findByText('Son aramalar')).toBeTruthy();
  expect(screen.getByText('pizza')).toBeTruthy();
  expect(screen.getByText('Popüler aramalar (Mock)')).toBeTruthy();
  await fireEvent.press(screen.getByText('pizza'));
  expect(screen.getByPlaceholderText('Restoran veya yemek ara').props.value).toBe('pizza');
});

it('offers cuisine chips when there is no history and hides the mock row without mocks', async () => {
  mockShowMocks = false;
  await renderWithProviders(<SearchScreen />);
  expect(await screen.findByText('Mutfaklar')).toBeTruthy();
  expect(screen.queryByText('Popüler aramalar (Mock)')).toBeNull();
  await fireEvent.press(screen.getByText('Kahve'));
  expect(screen.getByPlaceholderText('Restoran veya yemek ara').props.value).toBe('Kahve');
});
