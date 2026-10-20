import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, ScrollView } from 'react-native';
import Restaurant from '@/app/restaurant/[branchId]';
import { formatMoney } from '@/lib/money';
import { mockProductLike, restaurantRating } from '@/mocks/restaurant-mocks';
import * as branches from '@/services/branch.service';
import * as menus from '@/services/menu.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (p: unknown) => mockPush(p), back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: () => ({ branchId: 'br1' }),
  Stack: { Screen: () => null },
}));

// The cart bar has its own tests (and needs the auth provider); keep it out of the menu page.
jest.mock('@/components/CartBar', () => ({ CartBar: () => null }));

// Mock fields are switched by a getter so one file can run the page with and without them.
let mockShowMocks = false;
jest.mock('@/config', () =>
  Object.defineProperty({ ...jest.requireActual('@/config'), __esModule: true }, 'SHOW_MOCKS', { get: () => mockShowMocks, enumerable: true }),
);

// The progress bar reads the cart, which needs the auth provider; hand it a cart directly.
let mockCart: unknown = null;
jest.mock('@/queries/useCart', () => ({ useCart: () => ({ data: mockCart }) }));

const detail = (extra: object = {}) =>
  ({ id: 'br1', brandId: 'brand1', name: 'Premium Burger Co', slug: 'pbc', addressText: 'Moda Cd. 10', logoUrl: null, bannerUrls: null, currency: 'TRY', currencySymbol: '₺', isActive: true, isOpen: true, ...extra }) as never;
const withHours = (business_hour: unknown) => detail({ business_hour });

const product = (id: string, name: string, extra: object = {}) => ({ id, name, categoryId: 'c', brandId: 'brand1', description: `${name} açıklaması`, price: 150, discountedPrice: null, imageUrl: null, currency: 'TRY', currencySymbol: '₺', ...extra });
const menu = (categories: object[]) => ({ branchId: 'br1', brandId: 'brand1', currency: 'TRY', currencySymbol: '₺', categories }) as never;
/** No discounted and no tagged product, so the page has only the category tabs. */
const twoCategories = menu([
  { id: 'c1', name: 'Burgerler', description: null, products: [product('p1', 'Klasik Burger'), product('p2', 'Çift Burger', { price: 200 })] },
  { id: 'c2', name: 'İçecekler', description: null, products: [product('p3', 'Limonata')] },
]);

const closedToday = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  return { [days[new Date().getDay()]]: { isOpen: false, timeSlots: [] } };
};

async function renderPage(branch: unknown = detail(), data: unknown = twoCategories) {
  jest.spyOn(branches, 'getBranch').mockResolvedValue(branch as never);
  jest.spyOn(menus, 'getBranchMenu').mockResolvedValue(data as never);
  await renderWithProviders(<Restaurant />);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockShowMocks = false;
  mockCart = null;
});

it('lists the categories and products of the menu', async () => {
  await renderPage();
  await waitFor(() => expect(screen.getByText('Klasik Burger')).toBeTruthy());
  // Each category is a tab and a section title that carries its product count.
  expect(within(screen.getByTestId('menu-tabs')).getByText('Burgerler')).toBeTruthy();
  expect(screen.getByText('Burgerler (2 ürün)')).toBeTruthy();
  expect(screen.getByText('İçecekler (1 ürün)')).toBeTruthy();
  expect(screen.getByText('Çift Burger')).toBeTruthy();
  expect(screen.getByText('Limonata')).toBeTruthy();
  expect(screen.queryByText('Şu an kapalı, sipariş verilemez')).toBeNull();
});

it('opens the product sheet with the branch and brand', async () => {
  await renderPage();
  await fireEvent.press(await screen.findByText('Limonata'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/product/[id]', params: { id: 'p3', branchId: 'br1', brandId: 'brand1' } });
});

it('shows the closed strip and refuses to open a product when the branch is closed', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await renderPage(withHours(closedToday()));
  await waitFor(() => expect(screen.getByText('Şu an kapalı, sipariş verilemez')).toBeTruthy());
  await fireEvent.press(screen.getByText('Limonata'));
  expect(alert).toHaveBeenCalledWith('Şu an kapalı, sipariş verilemez');
  expect(mockPush).not.toHaveBeenCalled();
});

it('shows the empty state for an empty menu', async () => {
  await renderPage(detail(), menu([]));
  await waitFor(() => expect(screen.getByText('Bu restoranın menüsü şu an boş')).toBeTruthy());
});

it('shows retry when the menu fails to load', async () => {
  jest.spyOn(branches, 'getBranch').mockResolvedValue(detail());
  jest.spyOn(menus, 'getBranchMenu').mockRejectedValue(new Error('offline'));
  await renderWithProviders(<Restaurant />);
  await waitFor(() => expect(screen.getByText('Tekrar dene')).toBeTruthy());
});

describe('cover and title card', () => {
  it('shows the name, the cover buttons and the rating box (a mock)', async () => {
    mockShowMocks = true;
    await renderPage();
    await screen.findByText('Premium Burger Co');
    for (const label of ['Geri', 'Menüde ara', 'Favorilere ekle', 'Paylaş', 'Restoran bilgisi']) expect(screen.getByLabelText(label)).toBeTruthy();
    const rating = within(screen.getByLabelText('Yorumlar'));
    expect(rating.getByText('Mock')).toBeTruthy();
    const { rating: score, count } = restaurantRating('br1');
    expect(rating.getByText(count >= 100 ? `${count}+` : String(count))).toBeTruthy();
    expect(rating.getByText(new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1 }).format(score))).toBeTruthy();
  });

  it('opens the info sheet with the address and the maps link, and the reviews sheet titled Mock', async () => {
    mockShowMocks = true;
    await renderPage(detail({ phone: '0216 555 00 00' }));
    await fireEvent.press(await screen.findByLabelText('Restoran bilgisi'));
    expect(screen.getByText('Moda Cd. 10', { exact: false })).toBeTruthy();
    expect(screen.getByText('0216 555 00 00')).toBeTruthy();
    expect(screen.getByText('Haritada aç')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Yorumlar'));
    expect(screen.getByText('Yorumlar (Mock)')).toBeTruthy();
  });

  it('lists the weekly hours in the info sheet with today in bold', async () => {
    const hours = { monday: { isOpen: true, timeSlots: [{ open: '09:00', close: '22:00' }] }, tuesday: { isOpen: false, timeSlots: [] } };
    await renderPage(withHours(hours));
    await fireEvent.press(await screen.findByLabelText('Restoran bilgisi'));
    expect(within(screen.getByTestId('hours-monday')).getByText('09:00–22:00')).toBeTruthy();
    expect(within(screen.getByTestId('hours-tuesday')).getByText('Kapalı')).toBeTruthy();
  });
});

describe('delivery / pick-up and payment methods', () => {
  const on = { isActive: true };
  it('offers only what the branch enables and switches the card text without leaving the page', async () => {
    mockShowMocks = true;
    await renderPage(detail({ order_type_settings: { delivery: on, pickup: on } }));
    await fireEvent.press(await screen.findByRole('tab', { name: 'Gel-al' }));
    expect(screen.getByText('Siparişini restorandan kendin teslim alırsın')).toBeTruthy();
    expect(screen.getByText('Moda Cd. 10')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'Teslimat' }));
    expect(screen.getByText('Siparişin restoranın kuryesiyle sıcak teslim edilir')).toBeTruthy();
  });

  it('shows a single option when only one is active and nothing when none is', async () => {
    await renderPage(detail({ order_type_settings: { delivery: on, pickup: { isActive: false } } }));
    await screen.findByText('Premium Burger Co');
    expect(screen.getByRole('tab', { name: 'Teslimat' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Gel-al' })).toBeNull();
  });

  it('hides the switch for a branch with nothing enabled', async () => {
    await renderPage(detail({ order_type_settings: { delivery: { isActive: false } } }));
    await screen.findByText('Premium Burger Co');
    expect(screen.queryByRole('tab')).toBeNull();
  });

  it('uses the real minimum basket (no mock tag) and the branch currency symbol', async () => {
    mockShowMocks = true;
    await renderPage(detail({ minBasketPrice: 250, order_type_settings: { delivery: on } }));
    expect(await screen.findByText(`Min ${formatMoney(250, 'TRY', { symbol: '₺', whole: true })}`)).toBeTruthy();
  });

  it('draws no empty card when there is nothing real to show (mocks off, no minimum basket / no address)', async () => {
    await renderPage(detail({ order_type_settings: { delivery: on } }));
    await screen.findByRole('tab', { name: 'Teslimat' });
    expect(screen.queryByTestId('fulfillment-card')).toBeNull();
  });

  it('draws the card once a real minimum basket exists, and for pick-up with an address', async () => {
    await renderPage(detail({ minBasketPrice: 250, order_type_settings: { delivery: on } }));
    expect(await screen.findByTestId('fulfillment-card')).toBeTruthy();
  });

  it('draws no pick-up card without an address while mocks are off', async () => {
    await renderPage(detail({ addressText: null, order_type_settings: { pickup: on } }));
    await screen.findByRole('tab', { name: 'Gel-al' });
    expect(screen.queryByTestId('fulfillment-card')).toBeNull();
  });

  it('shows every payment method unless the branch switches one off', async () => {
    await renderPage();
    await screen.findByText('Premium Burger Co');
    for (const label of ['Kart ile online', 'Kapıda kart', 'Nakit']) expect(screen.getByText(label)).toBeTruthy();
  });

  it('drops a switched-off payment method', async () => {
    await renderPage(detail({ payment_settings: { offlineMethods: { cash: { isActive: false } } } }));
    await screen.findByText('Kapıda kart');
    expect(screen.queryByText('Nakit')).toBeNull();
  });
});

describe('search, popular and discounted', () => {
  const pizzas = menu([
    { id: 'c1', name: 'Pizzalar', description: null, products: [product('a', 'Margherita', { description: 'Domates ve mozzarella' }), product('b', 'Pepperoni', { description: 'Acılı sucuk' })] },
    { id: 'c2', name: 'İçecekler', description: null, products: [product('c', 'Limonata')] },
  ]);

  it('filters the menu while typing, accent-insensitively, hiding tabs', async () => {
    await renderPage(detail(), pizzas);
    await screen.findByText('Pepperoni');
    await fireEvent.changeText(screen.getByPlaceholderText('Restoranda ara'), 'marg');
    expect(screen.getByText('Margherita')).toBeTruthy();
    expect(screen.queryByText('Pepperoni')).toBeNull();
    expect(screen.queryByText('Limonata')).toBeNull();
    expect(screen.queryByTestId('menu-tabs')).toBeNull();
    // The description counts too, with folded accents ("sucuk" -> "Acılı sucuk").
    await fireEvent.changeText(screen.getByPlaceholderText('Restoranda ara'), 'ACILI');
    expect(screen.getByText('Pepperoni')).toBeTruthy();
  });

  it('shows an empty state when nothing matches and restores the menu when cleared', async () => {
    await renderPage(detail(), pizzas);
    await screen.findByText('Pepperoni');
    await fireEvent.changeText(screen.getByPlaceholderText('Restoranda ara'), 'xyz');
    expect(screen.getByText('"xyz" için ürün bulunamadı')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Aramayı temizle'));
    expect(screen.getByText('Pepperoni')).toBeTruthy();
    expect(screen.getByTestId('menu-tabs')).toBeTruthy();
  });

  const tagged = menu([
    { id: 'c1', name: 'Pizzalar', description: null, products: [product('a', 'Margherita'), product('b', 'Pepperoni', { tags: ['bestseller'] })] },
  ]);

  it('ranks bestseller-tagged products as Popüler #1, with no Mock label', async () => {
    await renderPage(detail(), tagged);
    const section = within(await screen.findByTestId('section-popular'));
    expect(section.getByText('Popüler #1')).toBeTruthy();
    expect(section.getByText('Pepperoni')).toBeTruthy();
    expect(section.queryByText('Margherita')).toBeNull();
    expect(section.getByText('Popüler lezzetler')).toBeTruthy();
  });

  it('falls back to the first products labelled Mock, and hides the section without mocks', async () => {
    mockShowMocks = true;
    await renderPage(detail(), pizzas);
    expect(await screen.findByText('Popüler lezzetler (Mock)')).toBeTruthy();
  });

  it('has no popular section without mocks when nothing is tagged', async () => {
    await renderPage(detail(), pizzas);
    await screen.findByText('Pepperoni');
    expect(screen.queryByTestId('section-popular')).toBeNull();
  });

  it('lists discounted products with the sale price, the struck old price and the percent off', async () => {
    const sale = menu([{ id: 'c1', name: 'Burgerler', description: null, products: [product('a', 'Çift Burger', { price: 200, discountedPrice: 180 }), product('b', 'Klasik Burger')] }]);
    await renderPage(detail(), sale);
    const rail = within(await screen.findByTestId('section-discounted'));
    expect(rail.getByText('İndirimli ürünler')).toBeTruthy();
    expect(rail.getByText('Çift Burger')).toBeTruthy();
    expect(rail.queryByText('Klasik Burger')).toBeNull();
    expect(rail.getByText(formatMoney(180, 'TRY', { symbol: '₺' }))).toBeTruthy();
    expect(rail.getByText(formatMoney(200, 'TRY', { symbol: '₺' }))).toBeTruthy();
    expect(rail.getByText('%10 indirim')).toBeTruthy();
    // The menu row shows the same sale price.
    expect(within(screen.getByTestId('section-c1')).getByText(formatMoney(180, 'TRY', { symbol: '₺' }))).toBeTruthy();
  });

  it('shows the old price struck through on a discounted popular card', async () => {
    const sale = menu([{ id: 'c1', name: 'Burgerler', description: null, products: [product('a', 'Çift Burger', { price: 200, discountedPrice: 180, tags: ['bestseller'] })] }]);
    await renderPage(detail(), sale);
    const popular = within(await screen.findByTestId('section-popular'));
    expect(popular.getByText(formatMoney(180, 'TRY', { symbol: '₺' }))).toBeTruthy();
    expect(popular.getByText(formatMoney(200, 'TRY', { symbol: '₺' }))).toBeTruthy();
  });

  it('keeps the pinned title row (back, search) while searching, without the tabs', async () => {
    await renderPage(detail(), pizzas);
    await screen.findByText('Pepperoni');
    await fireEvent(screen.getByTestId('menu-tabs'), 'layout', { nativeEvent: { layout: { x: 0, y: 400, width: 390, height: 50 } } });
    await fireEvent.changeText(screen.getByPlaceholderText('Restoranda ara'), 'marg');
    await fireEvent.scroll(screen.getByTestId('menu-scroll'), {
      nativeEvent: { contentOffset: { x: 0, y: 500 }, layoutMeasurement: { width: 390, height: 800 }, contentSize: { width: 390, height: 1300 } },
    });
    const pinned = within(screen.getByTestId('menu-tabs-pinned'));
    expect(pinned.getByLabelText('Geri')).toBeTruthy();
    expect(pinned.getByLabelText('Menüde ara')).toBeTruthy();
    expect(pinned.queryByRole('button', { name: 'Pizzalar' })).toBeNull();
  });

  it('opens the product sheet from a popular card', async () => {
    await renderPage(detail(), tagged);
    await fireEvent.press(within(await screen.findByTestId('section-popular')).getByText('Pepperoni'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/product/[id]', params: { id: 'b', branchId: 'br1', brandId: 'brand1' } });
  });

  it('puts popular and discounted first in the tabs', async () => {
    const both = menu([{ id: 'c1', name: 'Burgerler', description: null, products: [product('a', 'Çift Burger', { price: 200, discountedPrice: 180, tags: ['bestseller'] })] }]);
    await renderPage(detail(), both);
    const tabs = within(await screen.findByTestId('menu-tabs'));
    expect(tabs.getByRole('button', { name: 'Popüler', selected: true })).toBeTruthy();
    expect(tabs.getByRole('button', { name: 'İndirimli' })).toBeTruthy();
    expect(tabs.getByRole('button', { name: 'Burgerler' })).toBeTruthy();
  });
});

describe('mock fields', () => {
  const items = Array.from({ length: 12 }, (_, i) => product(`q${i}`, `Ürün ${i}`));
  const catalogue = menu([{ id: 'c1', name: 'Hepsi', description: null, products: items }]);
  const cart = { branchId: 'br1', brandId: 'brand1', totalCartPrice: 100, finalPrice: 100, items: [{ id: 'i1', productId: 'q0', productName: 'Ürün 0', price: 100, qty: 1, imgUrl: null }] };

  it('shows ticket coupons, like lines and the reward bar, each with a Mock tag', async () => {
    mockShowMocks = true;
    mockCart = cart;
    await renderPage(detail(), catalogue);
    await screen.findByTestId('section-c1');
    expect(screen.getByText('Otomatik uygulanır')).toBeTruthy();
    const liked = items.filter((p) => mockProductLike(p.id) != null);
    expect(liked.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/beğenildi/)).toHaveLength(liked.length);
    const bar = within(screen.getByTestId('cart-progress'));
    expect(bar.getByText(/daha ekle/)).toBeTruthy();
    expect(bar.getByText('Mock')).toBeTruthy();
  });

  it('says the coupon is earned once the basket passes the goal', async () => {
    mockShowMocks = true;
    mockCart = { ...cart, totalCartPrice: 5000, finalPrice: 5000 };
    await renderPage(detail(), catalogue);
    expect(await screen.findByText('Kuponu kazandın!')).toBeTruthy();
  });

  it('shows no reward bar for a cart from another restaurant', async () => {
    mockShowMocks = true;
    mockCart = { ...cart, branchId: 'other' };
    await renderPage(detail(), catalogue);
    await screen.findByTestId('section-c1');
    expect(screen.queryByTestId('cart-progress')).toBeNull();
  });

  it('hides every mock when SHOW_MOCKS is off: rating box, coupons, likes and the reward bar', async () => {
    mockShowMocks = false;
    mockCart = cart;
    await renderPage(detail(), catalogue);
    await screen.findByTestId('section-c1');
    expect(screen.queryByText('Mock')).toBeNull();
    expect(screen.queryByLabelText('Yorumlar')).toBeNull();
    expect(screen.queryByText('Otomatik uygulanır')).toBeNull();
    expect(screen.queryByText(/beğenildi/)).toBeNull();
    expect(screen.queryByTestId('cart-progress')).toBeNull();
    expect(screen.queryByText(/Mock/)).toBeNull();
  });
});

describe('category tabs', () => {
  const layout = (y: number, height: number) => ({ nativeEvent: { layout: { x: 0, y, width: 390, height } } });
  const scrollTo = (offset: number, viewport = 800, content = 1300) =>
    fireEvent.scroll(screen.getByTestId('menu-scroll'), {
      nativeEvent: { contentOffset: { x: 0, y: offset }, layoutMeasurement: { width: 390, height: viewport }, contentSize: { width: 390, height: content } },
    });

  // Safe-area insets are 0 in tests, so the pinned zone is the 44 px nav bar; tabs are 50 px tall at y 400.
  async function renderMeasured() {
    await renderPage();
    await screen.findByText('Klasik Burger');
    await fireEvent(screen.getByTestId('menu-tabs'), 'layout', layout(400, 50));
    await fireEvent(screen.getByTestId('section-c1'), 'layout', layout(450, 300));
    await fireEvent(screen.getByTestId('section-c2'), 'layout', layout(750, 200));
  }
  const tabs = () => within(screen.getByTestId('menu-tabs'));
  const tab = (name: string) => tabs().getByText(name);
  const isSelected = (name: string) => tabs().queryByRole('button', { name, selected: true }) != null;

  it('pins a copy of the tabs only once the in-flow row has scrolled under the header', async () => {
    await renderMeasured();
    await scrollTo(100);
    expect(screen.queryByTestId('menu-tabs-pinned')).toBeNull();
    await scrollTo(355);
    expect(screen.queryByTestId('menu-tabs-pinned')).toBeNull();
    await scrollTo(356);
    expect(screen.getByTestId('menu-tabs-pinned')).toBeTruthy();
    await scrollTo(0);
    expect(screen.queryByTestId('menu-tabs-pinned')).toBeNull();
  });

  it('marks the section being read as active while scrolling', async () => {
    await renderMeasured();
    expect(isSelected('Burgerler')).toBe(true);
    await scrollTo(700);
    expect(isSelected('İçecekler')).toBe(true);
    expect(isSelected('Burgerler')).toBe(false);
    await scrollTo(300);
    expect(isSelected('Burgerler')).toBe(true);
  });

  it('selects the last section at the end of the page even if it is short', async () => {
    await renderMeasured();
    // Content 1000 in an 800 viewport: the end is offset 200, where "İçecekler" (y 750) is still below the line (200 + 44 + 50 + 1).
    await scrollTo(150, 800, 1000);
    expect(isSelected('Burgerler')).toBe(true);
    await scrollTo(200, 800, 1000);
    expect(isSelected('İçecekler')).toBe(true);
  });

  it('scrolls to the measured section and selects it when a tab is pressed', async () => {
    await renderMeasured();
    // jest's ScrollView mock shares one jest.fn for scrollTo across instances.
    const spy = jest.spyOn(ScrollView.prototype as unknown as { scrollTo: () => void }, 'scrollTo');
    await fireEvent.press(tab('İçecekler'));
    expect(spy).toHaveBeenCalledWith({ y: 750 - 44 - 50, animated: true });
    expect(isSelected('İçecekler')).toBe(true);
    // The scroll the animation produces must not hand the selection back.
    await scrollTo(0);
    expect(isSelected('İçecekler')).toBe(true);
  });
});
