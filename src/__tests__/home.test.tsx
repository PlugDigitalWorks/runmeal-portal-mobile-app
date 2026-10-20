import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import Home from '@/app/(tabs)/index';
import { HomeViewProvider } from '@/context/HomeViewContext';
import { resetCountdown } from '@/lib/countdown';
import { branchPromos, hasPlusBadge, isSponsored } from '@/mocks/home-mocks';
import * as branches from '@/services/branch.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
let mockShowMocks = true;
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p) }, useFocusEffect: (callback: () => void | (() => void)) => jest.requireActual('react').useEffect(callback, [callback]) }));
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
beforeEach(() => {
  jest.useFakeTimers();
  resetCountdown();
});
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

/** An open branch (by id) with the given mock traits, found among ids so the test does not hard-code the hash. */
const idWhere = (match: (id: string) => boolean) => {
  const found = Array.from({ length: 200 }, (_, i) => `t${i}`).find(match);
  if (!found) throw new Error('no id matches');
  return found;
};

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
    for (const title of ['Sepette %20 indirim', 'İlk siparişe 100 ₺', '2 al 1 öde pizza', 'Kahvede ikincisi %50', 'Ücretsiz teslimat haftası']) {
      expect(screen.getByLabelText(title)).toBeTruthy();
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

  it('shows chains as stories: one circle per chain, the nearest branch on tap, tiny labelled title', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([
      row('1', 'Pizza House #1', 900, { brandSlug: 'pizza-house', logoUrl: 'https://img/logo.png' }),
      row('2', 'Pizza House #2', 300, { brandSlug: 'pizza-house' }),
      row('3', 'Solo Cafe', 500, { brandSlug: 'solo-cafe' }),
    ]);
    await renderHome();
    expect(await screen.findByText('Zincir restoranlar (Mock)')).toBeTruthy();
    expect(screen.getByLabelText('Pizza House')).toBeTruthy();
    // A brand with a single nearby branch is not a chain.
    expect(screen.queryByLabelText('Solo Cafe', { exact: true })).toBeNull();
    await fireEvent.press(screen.getByLabelText('Pizza House'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/restaurant/[branchId]', params: { branchId: '2' } });
  });

  it('puts the hero banner first and the chain stories directly below it', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([
      row('1', 'Pizza House #1', 900, { brandSlug: 'pizza-house' }),
      row('2', 'Pizza House #2', 300, { brandSlug: 'pizza-house' }),
    ]);
    await renderHome();
    await screen.findByText('Zincir restoranlar (Mock)');
    const texts: string[] = [];
    const walk = (node: unknown) => {
      if (typeof node === 'string') texts.push(node);
      else if (node && typeof node === 'object' && 'children' in node && Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(screen.toJSON());
    const at = (label: string) => texts.indexOf(label);
    const labels = ['SEPETTE EFSANE İNDİRİMLER', 'Zincir restoranlar (Mock)', 'Kampanyalar (5) (Mock)'].map(at);
    expect(labels.every((i) => i >= 0)).toBe(true);
    expect([...labels].sort((x, y) => x - y)).toEqual(labels);
  });

  it('has no chain stories when mocks are off', async () => {
    mockShowMocks = false;
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([
      row('1', 'Pizza House #1', 900, { brandSlug: 'pizza-house' }),
      row('2', 'Pizza House #2', 300, { brandSlug: 'pizza-house' }),
    ]);
    await renderHome();
    await waitFor(() => expect(listNames()).toHaveLength(2));
    expect(screen.queryByText(/Zincir/)).toBeNull();
    expect(screen.queryByLabelText('Pizza House')).toBeNull();
  });
});

describe('campaign artwork and promo strips', () => {
  const openRow = (id: string, name: string) => row(id, name, 400, { business_hour: hours(true) });
  const PROMO_TEXT = ['İlk 5 siparişe özel ₺200 indirim', '2 büyük pizza ₺499', '₺450 üzeri %15 indirim', 'Büyük boy fırsatı', 'Sepette ₺300 indirim'];

  it('draws the campaign posters, the hero banner and the strips with their labels', async () => {
    const id = idWhere((x) => branchPromos(x).length > 0);
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([openRow(id, 'Promo Place')]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Promo Place']));
    expect(screen.getByText('SEPETTE EFSANE İNDİRİMLER')).toBeTruthy();
    expect(screen.getByText('SEPETTE %20 İNDİRİM')).toBeTruthy();
    expect(screen.getByText('İLK SİPARİŞE')).toBeTruthy();
    expect(PROMO_TEXT.reduce((n, text) => n + screen.queryAllByText(text).length, 0)).toBeGreaterThan(0);
    // One small tag per card, plus the ones on the posters and the strip.
    expect(screen.getAllByText('Mock').length).toBeGreaterThan(1);
  });

  it('shows the "Runmeal+ indirimi" badge on a branch that has it, with its strips', async () => {
    const id = idWhere(hasPlusBadge);
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([openRow(id, 'Plus Place')]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Plus Place']));
    expect(screen.getAllByText('Runmeal+ indirimi').length).toBeGreaterThan(0);
    for (const key of branchPromos(id)) expect(screen.getAllByText(PROMO_TEXT[['firstFive', 'twoPizzas', 'over450', 'bigBoy', 'basket300'].indexOf(key)]).length).toBeGreaterThan(0);
  });

  it('shows the grey "Sponsorlu" pill on a sponsored branch', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([openRow(idWhere(isSponsored), 'Sponsored Place')]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Sponsored Place']));
    expect(screen.getAllByText('Sponsorlu').length).toBeGreaterThan(0);
  });

  it('leaves the pill off a branch that is not sponsored', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([openRow(idWhere((x) => !isSponsored(x)), 'Plain Place')]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Plain Place']));
    expect(screen.queryByText('Sponsorlu')).toBeNull();
  });

  it('hides strips, rating, Sponsorlu, posters and the countdown when mocks are off', async () => {
    mockShowMocks = false;
    const id = idWhere((x) => branchPromos(x).length > 0 && hasPlusBadge(x) && isSponsored(x));
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([openRow(id, 'Promo Place')]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Promo Place']));
    for (const text of [...PROMO_TEXT, 'Runmeal+ indirimi', 'Sponsorlu', 'SEPETTE EFSANE İNDİRİMLER', 'SEPETTE %20 İNDİRİM']) expect(screen.queryByText(text)).toBeNull();
    expect(screen.queryByText(/^\d\.\d \(/)).toBeNull();
    expect(screen.queryByLabelText(/dk : \d\d sn/)).toBeNull();
  });
});

describe('countdown strip', () => {
  it('starts at 15 dk : 00 sn, ticks every second and goes away when closed', async () => {
    pizzaAndBurger();
    await renderHome();
    expect(screen.getByLabelText('15 dk : 00 sn')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText('14 dk : 59 sn')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Kapat'));
    expect(screen.queryByLabelText(/dk : \d\d sn/)).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('opens the deals screen when the strip is tapped', async () => {
    pizzaAndBurger();
    await renderHome();
    await fireEvent.press(screen.getByLabelText('Fırsatları gör'));
    expect(mockPush).toHaveBeenCalledWith('/deals');
  });

  it('starts over after reaching zero', async () => {
    pizzaAndBurger();
    await renderHome();
    await act(async () => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });
    expect(screen.getByLabelText('00 dk : 00 sn')).toBeTruthy();
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByLabelText('15 dk : 00 sn')).toBeTruthy();
  });
});

describe('card money', () => {
  it('shows the minimum basket in whole units and the branch currency, real or mock', async () => {
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([
      row('real', 'Real Min Place', 300, { minBasketPrice: 250 }),
      row('gbp', 'Pound Place', 400, { currency: 'GBP', currencySymbol: '£' }),
    ]);
    await renderHome();
    await waitFor(() => expect(listNames()).toHaveLength(2));
    expect(screen.getAllByText(/^Min ₺250 ·/).length).toBeGreaterThan(0);
    // Mock minimum on a pound branch: 10 to 30 pounds, no decimals, no lira sign anywhere on the card.
    const gbp = screen.getAllByText(/^Min £(1\d|2\d|30) ·/);
    expect(gbp.length).toBeGreaterThan(0);
    expect(screen.queryByText(/Min TRY/)).toBeNull();
    expect(screen.queryByText(/,00/)).toBeNull();
  });

  it('writes promo amounts in the branch currency', async () => {
    const id = idWhere((x) => branchPromos(x).some((k) => k !== 'bigBoy'));
    jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue([row(id, 'Pound Promo Place', 300, { currency: 'GBP', currencySymbol: '£', business_hour: hours(true) })]);
    await renderHome();
    await waitFor(() => expect(listNames()).toEqual(['Pound Promo Place']));
    const card = within(screen.getByTestId('all-restaurants-item'));
    expect(card.queryAllByText(/₺/)).toEqual([]);
    expect(card.getAllByText(/£\d/).length).toBeGreaterThan(0);
  });
});
