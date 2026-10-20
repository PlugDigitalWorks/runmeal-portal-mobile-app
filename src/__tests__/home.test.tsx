import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import Home from '@/app/(tabs)/index';
import { HomeViewProvider } from '@/context/HomeViewContext';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
let mockShowMocks = true;
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p) }, useFocusEffect: jest.fn() }));
jest.mock('@/config', () => {
  const config = { ...jest.requireActual('@/config') };
  Object.defineProperty(config, 'SHOW_MOCKS', { get: () => mockShowMocks });
  return config;
});
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ status: 'signedIn', user: { firstName: 'Ada', lastName: 'Yılmaz' } }) }));
jest.mock('@/context/LocationContext', () => ({
  useLocation: () => ({ activeAddress: { id: 'a', street: 'Moda Cd.', buildingNumber: '10', district: 'Kadıköy' }, coords: { latitude: 40.99, longitude: 29.03 }, isLoading: false, selectAddress: jest.fn() }),
}));
// The address sheet is mounted (closed) on the screen; keep it off the network.
jest.mock('@/queries/useAddresses', () => ({ useAddresses: () => ({ data: [] }) }));

const ALL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const hours = (isOpen: boolean) => Object.fromEntries(ALL_DAYS.map((d) => [d, { isOpen, timeSlots: [] }]));
const row = (id: string, name: string, distanceM: number, extra: object = {}) =>
  ({ id, name, slug: id, addressText: 'Kadıköy', logoUrl: null, bannerUrls: null, locationGeog: null, currency: 'TRY', currencySymbol: '₺', distanceM, ...extra }) as never;

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  mockShowMocks = true;
});

// Fake timers keep the lists' ~50ms cell-batching timer and react-query's notification timer from firing between awaits,
// where React would warn about an update outside act; afterEach runs what is left inside act.
beforeEach(() => jest.useFakeTimers());
afterEach(async () => {
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

const renderHome = async () => {
  const rendered = await renderWithProviders(
    <HomeViewProvider>
      <Home />
    </HomeViewProvider>,
  );
  // The favourites read is independent of the nearby call; let it land so it cannot re-render the screen mid-test.
  await waitFor(() => expect(rendered.client.getQueryState(['favorites'])?.status).toBe('success'));
  return rendered;
};
/** Names in the "Tüm restoranlar" list only: the horizontal rows repeat branches. */
const listNames = () => screen.getAllByTestId('all-restaurants-item').map((item) => within(item).getByTestId('branch-card-name').props.children);
const pizzaAndBurger = () => jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row('p', 'Artisan Pizza House', 900), row('b', 'Premium Burger Co', 300)]);

it('lists nearby branches nearest first and filters by cuisine tile', async () => {
  pizzaAndBurger();
  await renderHome();
  await waitFor(() => expect(screen.getAllByText('Premium Burger Co').length).toBeGreaterThan(0));
  expect(listNames()).toEqual(['Premium Burger Co', 'Artisan Pizza House']);
  await fireEvent.press(screen.getByText('Pizza'));
  expect(listNames()).toEqual(['Artisan Pizza House']);
  // Tapping the chosen tile again clears the choice.
  await fireEvent.press(screen.getByText('Pizza'));
  expect(listNames()).toEqual(['Premium Burger Co', 'Artisan Pizza House']);
});

it('shows the empty state', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([]);
  await renderHome();
  await waitFor(() => expect(screen.getByText('Bu adrese henüz teslimat yapan restoran yok')).toBeTruthy());
});

it('shows retry on error', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockRejectedValue(new Error('offline'));
  await renderHome();
  await waitFor(() => expect(screen.getByText('Tekrar dene')).toBeTruthy());
});

it('uses the Turkish singular when one branch remains', async () => {
  pizzaAndBurger();
  await renderHome();
  await waitFor(() => expect(screen.getByText('2 restoran')).toBeTruthy());
  await fireEvent.press(screen.getByText('Pizza'));
  expect(screen.getByText('1 restoran')).toBeTruthy();
});

it('keeps the list when a refresh fails', async () => {
  const spy = jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row('b', 'Premium Burger Co', 300)]);
  const { client } = await renderHome();
  await waitFor(() => expect(listNames()).toEqual(['Premium Burger Co']));
  // The favourites read finishes after the list; let it land so it cannot update the screen after the test.
  await waitFor(() => expect(client.isFetching()).toBe(0));
  spy.mockRejectedValue(new Error('offline'));
  await act(() => client.refetchQueries({ queryKey: ['nearby'] }));
  expect(listNames()).toEqual(['Premium Burger Co']);
  expect(screen.queryByText('Tekrar dene')).toBeNull();
});

it('features only open branches that have a banner', async () => {
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([
    row('a', 'Open With Banner', 100, { bannerUrls: ['https://img/a.jpg'], business_hour: hours(true) }),
    row('b', 'Closed With Banner', 200, { bannerUrls: ['https://img/b.jpg'], business_hour: hours(false) }),
    row('c', 'Open No Banner', 300, { business_hour: hours(true) }),
  ]);
  await renderHome();
  await waitFor(() => expect(screen.getByLabelText('Open With Banner')).toBeTruthy());
  expect(screen.queryByLabelText('Closed With Banner')).toBeNull();
  expect(screen.queryByLabelText('Open No Banner')).toBeNull();
});

it('leaves the featured row out when no open branch has a banner', async () => {
  pizzaAndBurger();
  await renderHome();
  await waitFor(() => expect(listNames()).toHaveLength(2));
  expect(screen.queryByLabelText('Öne çıkanlar')).toBeNull();
});

it('opens the search screen from the search bar', async () => {
  pizzaAndBurger();
  await renderHome();
  await fireEvent.press(screen.getByLabelText('Restoran, ürün veya mutfak ara'));
  expect(mockPush).toHaveBeenCalledWith('/search');
});

describe('see all', () => {
  it('leads the nearby row to /restaurants', async () => {
    mockShowMocks = false;
    pizzaAndBurger();
    await renderHome();
    await fireEvent.press(await screen.findByText('Tümünü gör'));
    expect(mockPush).toHaveBeenCalledWith('/restaurants');
  });

  it('with mocks on, the campaigns link comes first and goes to /campaigns', async () => {
    pizzaAndBurger();
    await renderHome();
    await waitFor(() => expect(screen.getAllByText('Tümünü gör')).toHaveLength(2));
    const [campaigns, nearby] = screen.getAllByText('Tümünü gör');
    await fireEvent.press(campaigns);
    expect(mockPush).toHaveBeenLastCalledWith('/campaigns');
    await fireEvent.press(nearby);
    expect(mockPush).toHaveBeenLastCalledWith('/restaurants');
  });
});

describe('sort and filter', () => {
  it('"only open" in the filter sheet drops the closed branch and shows a count', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([
      row('o', 'Open Place', 500, { business_hour: hours(true) }),
      row('c', 'Closed Place', 100, { business_hour: hours(false) }),
    ]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Open Place', 'Closed Place']));
    await fireEvent.press(screen.getByText('Filtrele'));
    await fireEvent.press(screen.getByText('Sadece açık olanlar'));
    await fireEvent.press(screen.getByText('Tamam'));
    expect(listNames()).toEqual(['Open Place']);
    expect(screen.getByText('1')).toBeTruthy();
  });

  it('"nearest" ignores whether a branch is open', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([
      row('o', 'Open Place', 500, { business_hour: hours(true) }),
      row('c', 'Closed Place', 100, { business_hour: hours(false) }),
    ]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Open Place', 'Closed Place']));
    await fireEvent.press(screen.getByText('Sırala'));
    await fireEvent.press(screen.getByText('En yakın'));
    expect(listNames()).toEqual(['Closed Place', 'Open Place']);
  });

  it('explains when the filters hide everything and clears them', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row('c', 'Closed Place', 100, { business_hour: hours(false) })]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Closed Place']));
    await fireEvent.press(screen.getByText('Filtrele'));
    await fireEvent.press(screen.getByText('Sadece açık olanlar'));
    await fireEvent.press(screen.getByText('Tamam'));
    expect(screen.getByText('Filtrelere uyan restoran yok')).toBeTruthy();
    await fireEvent.press(screen.getByText('Temizle'));
    expect(listNames()).toEqual(['Closed Place']);
  });

  it('offers the mock sort and filter only with their label', async () => {
    pizzaAndBurger();
    await renderHome();
    await fireEvent.press(await screen.findByText('Sırala'));
    expect(screen.getByText('En yüksek puan (Mock)')).toBeTruthy();
    expect(screen.getByText('En hızlı teslimat (Mock)')).toBeTruthy();
  });

  it('hides the mock sort options when mocks are off', async () => {
    mockShowMocks = false;
    pizzaAndBurger();
    await renderHome();
    await fireEvent.press(await screen.findByText('Sırala'));
    expect(screen.getByText('Önerilen')).toBeTruthy();
    expect(screen.queryByText('En yüksek puan (Mock)')).toBeNull();
  });
});

describe('mock sections', () => {
  it('shows the labelled campaigns row with five cards', async () => {
    pizzaAndBurger();
    await renderHome();
    expect(await screen.findByText('Kampanyalar (5) (Mock)')).toBeTruthy();
    for (const title of ['Sepette %20 indirim', 'İlk siparişe 100 ₺ indirim', '2 al 1 öde pizza', 'Kahvede ikincisi yarı fiyat', 'Ücretsiz teslimat haftası']) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    expect(screen.getByText('Sana özel restoranlar (Mock)')).toBeTruthy();
    expect(screen.getByText('Yüksek puanlılar (Mock)')).toBeTruthy();
    expect(screen.getByText('Mutfaklar (Mock)')).toBeTruthy();
  });

  it('tags the mock rating and delivery time on a card', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row('b', 'Premium Burger Co', 300)]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Premium Burger Co']));
    expect(screen.getAllByText('Mock').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^\d\.\d \(\d+\+\) ?$/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('10–15 dk').length).toBeGreaterThan(0);
  });

  it('hides every mock section and field when mocks are off', async () => {
    mockShowMocks = false;
    pizzaAndBurger();
    await renderHome();
    await waitFor(() => expect(listNames()).toHaveLength(2));
    expect(screen.queryByText(/Kampanyalar/)).toBeNull();
    expect(screen.queryByText(/Sana özel/)).toBeNull();
    expect(screen.queryByText(/Yüksek puanlılar/)).toBeNull();
    expect(screen.queryByText(/Zincir/)).toBeNull();
    expect(screen.queryByText('Mock')).toBeNull();
    expect(screen.queryByText(/dk$/)).toBeNull();
    // Cuisines stay, without the label.
    expect(screen.getByText('Mutfaklar')).toBeTruthy();
  });

  it('lists chains of one brand', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([
      row('1', 'Pizza House #1', 300, { brandSlug: 'pizza-house' }),
      row('2', 'Pizza House #2', 900, { brandSlug: 'pizza-house' }),
    ]);
    await renderHome();
    expect(await screen.findByText('Zincir restoranlar (Mock)')).toBeTruthy();
    expect(screen.getByText('2 şube')).toBeTruthy();
  });
});
