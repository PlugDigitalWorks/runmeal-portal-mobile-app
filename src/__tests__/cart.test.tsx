import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, Pressable, Text } from 'react-native';
import { useState } from 'react';
import CartScreen from '@/app/cart';
import { CartScreen as CartBody } from '@/components/CartScreen';
import { CartBar } from '@/components/CartBar';
import { qk } from '@/queries/keys';
import { useAddToCart } from '@/queries/useCart';
import * as branches from '@/services/branch.service';
import * as carts from '@/services/cart.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
const mockDismissTo = jest.fn();
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (p: unknown) => mockPush(p), dismissTo: (p: unknown) => mockDismissTo(p), navigate: (p: unknown) => mockNavigate(p) },
  Stack: { Screen: () => null },
}));
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ status: 'signedIn' }) }));

const item = (extra: object = {}) => ({ id: 'i1', productId: 'p1', productName: 'Klasik Burger', price: 150, qty: 1, imgUrl: null, lineTotal: 150, ...extra });
const cart = (extra: object = {}) => ({ id: 'c1', branchId: 'b1', brandId: 'r1', isActive: true, items: [item()], totalCartPrice: 150, finalPrice: 150, ...extra }) as never;
const detail = (extra: object = {}) =>
  ({ id: 'b1', brandId: 'r1', name: 'Premium Burger Co', slug: 'pbc', addressText: null, logoUrl: null, bannerUrls: null, currency: 'TRY', currencySymbol: '₺', ...extra }) as never;
const scope = { branchId: 'b1', brandId: 'r1' };

/** A mutation ends with a cart refetch; let it land inside the test so the re-render is not left dangling. */
const settled = (client: { isFetching: () => number; isMutating: () => number }) => waitFor(() => expect(client.isFetching() + client.isMutating()).toBe(0));

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  jest.spyOn(branches, 'getBranch').mockResolvedValue(detail());
});

/** Adds from branch b2 and prints what the mutation resolved to. */
function AddFromOtherBranch() {
  const { mutateAsync } = useAddToCart();
  const [result, setResult] = useState('');
  return (
    <>
      <Pressable onPress={async () => setResult(await mutateAsync({ dto: { productId: 'p9', qty: 1 }, branchId: 'b2', brandId: 'r2' }))}>
        <Text>add</Text>
      </Pressable>
      <Text>{`result:${result}`}</Text>
    </>
  );
}

describe('switching restaurants', () => {
  it('clears the old cart, then adds, once the person confirms', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart());
    const clear = jest.spyOn(carts, 'clearCart').mockResolvedValue();
    const add = jest.spyOn(carts, 'addCartItem').mockResolvedValue(cart());
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[1]?.onPress?.());
    await renderWithProviders(<AddFromOtherBranch />);
    await fireEvent.press(screen.getByText('add'));
    await waitFor(() => expect(screen.getByText('result:added')).toBeTruthy());
    expect(alert).toHaveBeenCalledWith('Sepetin değişsin mi?', expect.stringContaining('başka bir restoran'), expect.any(Array), expect.anything());
    expect(clear).toHaveBeenCalledWith('c1', scope);
    expect(add).toHaveBeenCalledWith({ productId: 'p9', qty: 1 }, { branchId: 'b2', brandId: 'r2' });
    expect(clear.mock.invocationCallOrder[0]).toBeLessThan(add.mock.invocationCallOrder[0]);
  });

  it('leaves the cart alone and reports cancelled when the person declines', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart());
    const clear = jest.spyOn(carts, 'clearCart').mockResolvedValue();
    const add = jest.spyOn(carts, 'addCartItem').mockResolvedValue(cart());
    jest.spyOn(Alert, 'alert').mockImplementation((_t, _m, buttons) => buttons?.[0]?.onPress?.());
    await renderWithProviders(<AddFromOtherBranch />);
    await fireEvent.press(screen.getByText('add'));
    await waitFor(() => expect(screen.getByText('result:cancelled')).toBeTruthy());
    expect(clear).not.toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });

  it('adds straight away to the cart of the same restaurant', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart({ branchId: 'b2', brandId: 'r2' }));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const add = jest.spyOn(carts, 'addCartItem').mockResolvedValue(cart());
    await renderWithProviders(<AddFromOtherBranch />);
    await fireEvent.press(screen.getByText('add'));
    await waitFor(() => expect(screen.getByText('result:added')).toBeTruthy());
    expect(alert).not.toHaveBeenCalled();
    expect(add).toHaveBeenCalledTimes(1);
  });
});

describe('cart screen', () => {
  it('shows the lines and the total', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart({ items: [item({ qty: 2, lineTotal: 300 }), item({ id: 'i2', productName: 'Limonata', price: 40, lineTotal: 40 })], totalCartPrice: 340, discountAmount: 40, finalPrice: 300 }));
    await renderWithProviders(<CartScreen />);
    expect(await screen.findByText('Klasik Burger')).toBeTruthy();
    expect(screen.getByText('Limonata')).toBeTruthy();
    expect(screen.getByText('₺340,00')).toBeTruthy();
    expect(screen.getByText('-₺40,00')).toBeTruthy();
    expect(screen.getAllByText('₺300,00').length).toBeGreaterThan(0);
  });

  it('removes a line when its quantity drops from one to zero', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart());
    const remove = jest.spyOn(carts, 'removeCartItem').mockResolvedValue();
    const setQty = jest.spyOn(carts, 'setCartItemQty').mockResolvedValue(undefined);
    const { client } = await renderWithProviders(<CartScreen />);
    await fireEvent.press(await screen.findByLabelText('Azalt'));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('i1', scope));
    expect(setQty).not.toHaveBeenCalled();
    await settled(client);
  });

  it('changes the quantity of a line above one', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart({ items: [item({ qty: 2, lineTotal: 300 })] }));
    const setQty = jest.spyOn(carts, 'setCartItemQty').mockResolvedValue(undefined);
    const { client } = await renderWithProviders(<CartScreen />);
    await fireEvent.press(await screen.findByLabelText('Artır'));
    await waitFor(() => expect(setQty).toHaveBeenCalledWith('i1', 3, scope));
    await settled(client);
  });

  it('shows the empty state and leads back to the restaurants', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(null);
    await renderWithProviders(<CartScreen />);
    expect(await screen.findByText('Sepetin boş')).toBeTruthy();
    await fireEvent.press(screen.getByText('Restoranlara göz at'));
    expect(mockDismissTo).toHaveBeenCalledWith('/(tabs)');
  });

  it('applies a promo code as an internal coupon for delivery', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart());
    const apply = jest.spyOn(carts, 'applyPromotion').mockResolvedValue(cart());
    const { client } = await renderWithProviders(<CartScreen />);
    await fireEvent.changeText(await screen.findByLabelText('Promosyon kodu'), 'WELCOME');
    await fireEvent.press(screen.getByText('Uygula'));
    await waitFor(() => expect(apply).toHaveBeenCalledWith('c1', { promotionCode: 'WELCOME', orderType: 'DELIVERY' }, scope));
    await settled(client);
  });

  it('removes an applied promotion', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart({ appliedPromotions: [{ type: 'INTERNAL', promotionCode: 'WELCOME', name: 'Hoş geldin' }] }));
    const remove = jest.spyOn(carts, 'removePromotion').mockResolvedValue(cart());
    const { client } = await renderWithProviders(<CartScreen />);
    expect(await screen.findByText('Hoş geldin')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Kaldır WELCOME'));
    await waitFor(() => expect(remove).toHaveBeenCalledWith('c1', scope, 'WELCOME'));
    await settled(client);
  });

  it('refuses to check out below the branch minimum', async () => {
    jest.spyOn(branches, 'getBranch').mockResolvedValue(detail({ minBasketPrice: 200 }));
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart());
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const { client } = await renderWithProviders(<CartScreen />);
    await screen.findByText('Klasik Burger');
    // The minimum comes from the branch call, which lands after the cart.
    await waitFor(() => expect(client.getQueryData(qk.branch('b1'))).toBeTruthy());
    await fireEvent.press(screen.getByText('Ödemeye geç'));
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Minimum sepet tutarı ₺200'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('goes to checkout when the minimum is unknown or met', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart());
    await renderWithProviders(<CartScreen />);
    await fireEvent.press(await screen.findByText('Ödemeye geç'));
    expect(mockPush).toHaveBeenCalledWith('/checkout');
  });
});

describe('cart tab', () => {
  it('draws its own title and shows the lines and the way to checkout', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart());
    await renderWithProviders(<CartBody variant="tab" />);
    expect(await screen.findByText('Klasik Burger')).toBeTruthy();
    expect(screen.getByText('Sepetim')).toBeTruthy();
    expect(await screen.findByText('Premium Burger Co')).toBeTruthy();
    await fireEvent.press(screen.getByText('Ödemeye geç'));
    expect(mockPush).toHaveBeenCalledWith('/checkout');
  });

  it('sends an empty cart back to the explore tab', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(null);
    await renderWithProviders(<CartBody variant="tab" />);
    await fireEvent.press(await screen.findByText('Restoranlara göz at'));
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');
    expect(mockDismissTo).not.toHaveBeenCalled();
  });
});

describe('cart bar', () => {
  it('shows the count, the branch and the total, and opens the cart', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart({ items: [item({ qty: 2, lineTotal: 300 }), item({ id: 'i2', price: 40, lineTotal: 40 })], totalCartPrice: 340, finalPrice: 340 }));
    await renderWithProviders(<CartBar />);
    expect(await screen.findByText('Sepete git')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('₺340,00')).toBeTruthy();
    expect(await screen.findByText('Premium Burger Co')).toBeTruthy();
    await fireEvent.press(screen.getByText('Sepete git'));
    expect(mockPush).toHaveBeenCalledWith('/cart');
  });

  it('renders nothing for an empty cart', async () => {
    jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart({ items: [] }));
    const { client } = await renderWithProviders(<CartBar />);
    await settled(client);
    expect(carts.getCurrentCart).toHaveBeenCalled();
    expect(screen.queryByText('Sepete git')).toBeNull();
  });
});
