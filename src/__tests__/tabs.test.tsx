import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Text } from 'react-native';
import '@/i18n';
import TabsLayout from '@/app/(tabs)/_layout';
import * as carts from '@/services/cart.service';

// useCart only fetches for signed-in people.
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ status: 'signedIn' }) }));
let mockShowMocks = true;
jest.mock('@/config', () => {
  const config = { ...jest.requireActual('@/config') };
  Object.defineProperty(config, 'SHOW_MOCKS', { get: () => mockShowMocks });
  return config;
});

const item = (id: string, qty: number) => ({ id, productId: id, productName: id, price: 10, qty, imgUrl: null, lineTotal: 10 * qty });
const cart = (items: ReturnType<typeof item>[]) => ({ id: 'c1', branchId: 'b1', brandId: 'r1', isActive: true, items, totalCartPrice: 0, finalPrice: 0 }) as never;

/** The real tab layout over stub screens; the screens have their own tests. */
async function renderTabs() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const stub = (name: string) =>
    function Stub() {
      return <Text>{`${name} screen`}</Text>;
    };
  function Layout() {
    return (
      <QueryClientProvider client={client}>
        <TabsLayout />
      </QueryClientProvider>
    );
  }
  return renderRouter(
    {
      '(tabs)/_layout': Layout,
      '(tabs)/index': stub('home'),
      '(tabs)/favorites': stub('favorites'),
      '(tabs)/cart': stub('cart'),
      '(tabs)/orders': stub('orders'),
      '(tabs)/campaigns': stub('campaigns'),
    },
    { initialUrl: '/' },
  );
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockShowMocks = true;
});

it('has the five tabs in order and no account tab', async () => {
  jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(null);
  await renderTabs();
  const labels = ['Keşfet', 'Favorilerim', 'Sepetim', 'Siparişlerim', 'Kampanyalar'];
  // The tab bar labels each button "<title>, tab, <n> of <total>", which also pins the order and the count.
  for (const [i, label] of labels.entries()) expect(await screen.findByLabelText(`${label}, tab, ${i + 1} of 5`)).toBeTruthy();
  expect(screen.queryByText('Hesap')).toBeNull();
});

it('shows the number of items in the cart on the Sepetim tab', async () => {
  jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart([item('a', 2), item('b', 1)]));
  await renderTabs();
  expect(await screen.findByText('3')).toBeTruthy();
});

it('shows no badge for an empty cart', async () => {
  const spy = jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart([]));
  await renderTabs();
  await screen.findByLabelText('Sepetim, tab, 3 of 5');
  await waitFor(() => expect(spy).toHaveBeenCalled());
  await act(async () => {});
  expect(screen.queryByText('0')).toBeNull();
});

it('has no Kampanyalar tab when mocks are off: every campaign is mock data', async () => {
  mockShowMocks = false;
  jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(null);
  await renderTabs();
  expect(await screen.findByLabelText('Siparişlerim, tab, 4 of 4')).toBeTruthy();
  expect(screen.queryByText('Kampanyalar')).toBeNull();
});
