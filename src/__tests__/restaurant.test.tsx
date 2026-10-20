import { fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import { Alert, ScrollView } from 'react-native';
import Restaurant from '@/app/restaurant/[branchId]';
import * as branches from '@/services/branch.service';
import * as menus from '@/services/menu.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (p: unknown) => mockPush(p) },
  useLocalSearchParams: () => ({ branchId: 'br1' }),
  Stack: { Screen: () => null },
}));

// The cart bar has its own tests (and needs the auth provider); keep it out of the menu page.
jest.mock('@/components/CartBar', () => ({ CartBar: () => null }));

const detail = (business_hour?: unknown) =>
  ({ id: 'br1', brandId: 'brand1', name: 'Premium Burger Co', slug: 'pbc', addressText: 'Moda Cd. 10', logoUrl: null, bannerUrls: null, currency: 'TRY', currencySymbol: '₺', isActive: true, isOpen: true, ...(business_hour ? { business_hour } : {}) }) as never;

const product = (id: string, name: string, extra: object = {}) => ({ id, name, categoryId: 'c', brandId: 'brand1', description: `${name} açıklaması`, price: 150, discountedPrice: null, imageUrl: null, currency: 'TRY', currencySymbol: '₺', ...extra });
const menu = (categories: object[]) => ({ branchId: 'br1', brandId: 'brand1', currency: 'TRY', currencySymbol: '₺', categories }) as never;
const twoCategories = menu([
  { id: 'c1', name: 'Burgerler', description: null, products: [product('p1', 'Klasik Burger'), product('p2', 'Çift Burger', { price: 200, discountedPrice: 180 })] },
  { id: 'c2', name: 'İçecekler', description: null, products: [product('p3', 'Limonata')] },
]);

const closedToday = () => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  return { [days[new Date().getDay()]]: { isOpen: false, timeSlots: [] } };
};

beforeEach(() => jest.clearAllMocks());

it('lists the categories and products of the menu', async () => {
  jest.spyOn(branches, 'getBranch').mockResolvedValue(detail());
  jest.spyOn(menus, 'getBranchMenu').mockResolvedValue(twoCategories);
  await renderWithProviders(<Restaurant />);
  await waitFor(() => expect(screen.getByText('Klasik Burger')).toBeTruthy());
  // Each category shows up twice: as a tab and as the section title.
  expect(screen.getAllByText('Burgerler')).toHaveLength(2);
  expect(screen.getAllByText('İçecekler')).toHaveLength(2);
  expect(screen.getByText('Çift Burger')).toBeTruthy();
  expect(screen.getByText('Limonata')).toBeTruthy();
  expect(screen.queryByText('Şu an kapalı, sipariş verilemez')).toBeNull();
});

it('opens the product sheet with the branch and brand', async () => {
  jest.spyOn(branches, 'getBranch').mockResolvedValue(detail());
  jest.spyOn(menus, 'getBranchMenu').mockResolvedValue(twoCategories);
  await renderWithProviders(<Restaurant />);
  await fireEvent.press(await screen.findByText('Limonata'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/product/[id]', params: { id: 'p3', branchId: 'br1', brandId: 'brand1' } });
});

it('shows the closed strip and refuses to open a product when the branch is closed', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  jest.spyOn(branches, 'getBranch').mockResolvedValue(detail(closedToday()));
  jest.spyOn(menus, 'getBranchMenu').mockResolvedValue(twoCategories);
  await renderWithProviders(<Restaurant />);
  await waitFor(() => expect(screen.getByText('Şu an kapalı, sipariş verilemez')).toBeTruthy());
  await fireEvent.press(screen.getByText('Limonata'));
  expect(alert).toHaveBeenCalledWith('Şu an kapalı, sipariş verilemez');
  expect(mockPush).not.toHaveBeenCalled();
});

it('shows the empty state for an empty menu', async () => {
  jest.spyOn(branches, 'getBranch').mockResolvedValue(detail());
  jest.spyOn(menus, 'getBranchMenu').mockResolvedValue(menu([]));
  await renderWithProviders(<Restaurant />);
  await waitFor(() => expect(screen.getByText('Bu restoranın menüsü şu an boş')).toBeTruthy());
});

it('shows retry when the menu fails to load', async () => {
  jest.spyOn(branches, 'getBranch').mockResolvedValue(detail());
  jest.spyOn(menus, 'getBranchMenu').mockRejectedValue(new Error('offline'));
  await renderWithProviders(<Restaurant />);
  await waitFor(() => expect(screen.getByText('Tekrar dene')).toBeTruthy());
});

describe('category tabs', () => {
  const layout = (y: number, height: number) => ({ nativeEvent: { layout: { x: 0, y, width: 390, height } } });
  const scrollTo = (offset: number, viewport = 800, content = 1300) =>
    fireEvent.scroll(screen.getByTestId('menu-scroll'), {
      nativeEvent: { contentOffset: { x: 0, y: offset }, layoutMeasurement: { width: 390, height: viewport }, contentSize: { width: 390, height: content } },
    });

  // Safe-area insets are 0 in tests, so the pinned zone is the 44 px nav bar; tabs are 50 px tall at y 400.
  async function renderMeasured() {
    jest.spyOn(branches, 'getBranch').mockResolvedValue(detail());
    jest.spyOn(menus, 'getBranchMenu').mockResolvedValue(twoCategories);
    await renderWithProviders(<Restaurant />);
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
