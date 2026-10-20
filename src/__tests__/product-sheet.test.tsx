import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import ProductSheet from '@/app/product/[id]';
import * as menus from '@/services/menu.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockBack = jest.fn();
const mockAdd = jest.fn();
const mockParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  router: { back: () => mockBack() },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/queries/useCart', () => ({ useAddToCart: () => ({ mutateAsync: (...args: unknown[]) => mockAdd(...args), isPending: false }) }));

const sizes = {
  id: 'g1',
  name: 'Size',
  type: 'VARIANT',
  isRequired: true,
  minSelections: 1,
  maxSelections: 1,
  options: [
    { id: 'o1', name: 'Small', priceDelta: 0, isDefault: false, sortOrder: 0 },
    { id: 'o2', name: 'Large', priceDelta: 20, isDefault: false, sortOrder: 1 },
  ],
};

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(mockParams, { id: 'p1', branchId: 'br1', brandId: 'brand1' });
  mockAdd.mockResolvedValue(undefined);
  jest.spyOn(menus, 'getProduct').mockResolvedValue({ id: 'p1', categoryId: 'c', name: 'Klasik Burger', description: 'Dana köfte', price: 150, discountedPrice: null, isActive: true, optionGroups: [sizes] } as never);
});

it('asks for the required variant instead of adding', async () => {
  await renderWithProviders(<ProductSheet />);
  await fireEvent.press(await screen.findByText(/Sepete ekle/));
  expect(screen.getByText('Size seçimi zorunlu')).toBeTruthy();
  expect(mockAdd).not.toHaveBeenCalled();
  expect(mockBack).not.toHaveBeenCalled();
});

it('adds the chosen option with branch and brand, then closes the sheet', async () => {
  await renderWithProviders(<ProductSheet />);
  await fireEvent.press(await screen.findByText('Large'));
  await fireEvent.press(screen.getByText(/Sepete ekle/));
  await waitFor(() => expect(mockAdd).toHaveBeenCalledTimes(1));
  expect(mockAdd).toHaveBeenCalledWith({
    dto: { productId: 'p1', qty: 1, options: [{ groupId: 'g1', optionId: 'o2' }] },
    branchId: 'br1',
    brandId: 'brand1',
  });
  await waitFor(() => expect(mockBack).toHaveBeenCalled());
});

it('shows the running total with options and quantity', async () => {
  await renderWithProviders(<ProductSheet />);
  await fireEvent.press(await screen.findByText('Large'));
  expect(screen.getByText(/Sepete ekle · ₺170,00/)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('+'));
  expect(screen.getByText(/Sepete ekle · ₺340,00/)).toBeTruthy();
});

it('shows the error state instead of adding when the branch or brand is missing', async () => {
  delete mockParams.brandId;
  await renderWithProviders(<ProductSheet />);
  expect(await screen.findByText('Ürün yüklenemedi')).toBeTruthy();
  expect(screen.queryByText(/Sepete ekle/)).toBeNull();
  expect(mockAdd).not.toHaveBeenCalled();
});
