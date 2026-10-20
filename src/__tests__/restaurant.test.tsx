import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
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
