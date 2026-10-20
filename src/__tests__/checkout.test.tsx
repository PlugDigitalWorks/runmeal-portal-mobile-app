import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import CheckoutScreen from '@/app/checkout';
import { getPendingPayment } from '@/lib/pending-payment';
import * as addressService from '@/services/address.service';
import * as branches from '@/services/branch.service';
import * as carts from '@/services/cart.service';
import * as loyalty from '@/services/loyalty.service';
import * as payments from '@/services/payment.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockDismissTo = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (p: unknown) => mockPush(p), replace: (p: unknown) => mockReplace(p), dismissTo: (p: unknown) => mockDismissTo(p) },
  Stack: { Screen: () => null },
}));
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ status: 'signedIn' }) }));

const address = { id: 'a1', street: 'Moda Cd. 10', district: 'Kadıköy', province: 'İstanbul', postalCode: '34710', phoneE164: '+905550000000', isActive: true, latitude: 40.99, longitude: 29.03 };
let mockActiveAddress: unknown = address;
jest.mock('@/context/LocationContext', () => ({
  useLocation: () => ({ activeAddress: mockActiveAddress, coords: mockActiveAddress ? { latitude: 40.99, longitude: 29.03 } : null, isLoading: false, selectAddress: jest.fn() }),
}));

const item = { id: 'i1', productId: 'p1', productName: 'Klasik Burger', price: 150, qty: 1, imgUrl: null, lineTotal: 150 };
const cart = { id: 'c1', branchId: 'b1', brandId: 'r1', isActive: true, items: [item], totalCartPrice: 150, finalPrice: 150 } as never;
const enabled = (...keys: string[]) => Object.fromEntries(['pickup', 'delivery', 'scheduledPickup', 'scheduledDelivery'].map((k) => [k, { isActive: keys.includes(k) }]));
const detail = (extra: object = {}) =>
  ({
    id: 'b1',
    brandId: 'r1',
    name: 'Premium Burger Co',
    slug: 'pbc',
    addressText: null,
    logoUrl: null,
    bannerUrls: null,
    currency: 'TRY',
    currencySymbol: '₺',
    order_type_settings: enabled('pickup'),
    payment_settings: { onlineMethods: { card: { isActive: true } }, offlineMethods: { cash: { isActive: true }, cardOnDelivery: { isActive: false } } },
    ...extra,
  }) as never;

const setup = (opts: { branch?: object; nearby?: { id: string }[]; availability?: object; credit?: number } = {}) => {
  jest.spyOn(carts, 'getCurrentCart').mockResolvedValue(cart);
  jest.spyOn(branches, 'getBranch').mockResolvedValue(detail(opts.branch));
  jest.spyOn(branches, 'getNearbyBranches').mockResolvedValue((opts.nearby ?? [{ id: 'b1' }]) as never);
  jest.spyOn(branches, 'getBranchAvailability').mockResolvedValue({ canAcceptOrders: true, reason: null, ...opts.availability });
  jest.spyOn(loyalty, 'getCreditBalance').mockResolvedValue(opts.credit ?? 0);
  jest.spyOn(addressService, 'getAddresses').mockResolvedValue([address] as never);
};

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  mockActiveAddress = address;
});

/** Orders end with a cart refetch; let it land inside the test so the re-render is not left dangling. */
const settled = (client: { isFetching: () => number }) => waitFor(() => expect(client.isFetching()).toBe(0));

describe('delivery coverage and order types', () => {
  it('drops delivery and says why when the branch is not in the nearby result for the address', async () => {
    setup({ branch: { order_type_settings: enabled('delivery', 'pickup') }, nearby: [{ id: 'other' }] });
    await renderWithProviders(<CheckoutScreen />);
    expect(await screen.findByText('Bu restoran seçili adrese teslimat yapmıyor')).toBeTruthy();
    expect(screen.queryByText('Teslimat')).toBeNull();
    expect(screen.getByText('Gel-al')).toBeTruthy();
  });

  it('offers delivery when the address is covered', async () => {
    setup({ branch: { order_type_settings: enabled('delivery', 'pickup') } });
    await renderWithProviders(<CheckoutScreen />);
    expect(await screen.findByText('Teslimat')).toBeTruthy();
    expect(screen.queryByText('Bu restoran seçili adrese teslimat yapmıyor')).toBeNull();
    expect(await screen.findByText('Moda Cd. 10')).toBeTruthy();
  });

  it('says the restaurant is not taking orders when every order type is off (what staging sends)', async () => {
    setup({ branch: { order_type_settings: enabled() } });
    await renderWithProviders(<CheckoutScreen />);
    expect(await screen.findByText('Bu restoran şu an sipariş almıyor')).toBeTruthy();
    expect(screen.queryByText(/Siparişi onayla/)).toBeNull();
  });

  it('shows the closed reason instead of the confirm button', async () => {
    setup({ availability: { canAcceptOrders: false, reason: 'Mutfak kapalı' } });
    await renderWithProviders(<CheckoutScreen />);
    expect(await screen.findByText('Mutfak kapalı')).toBeTruthy();
    expect(screen.queryByText(/Siparişi onayla/)).toBeNull();
  });
});

describe('placing the order', () => {
  it('places a cash pick-up order and opens it', async () => {
    setup();
    const initialize = jest.spyOn(payments, 'initializePayment').mockResolvedValue({ paymentId: 'p1', orderId: 'o1' });
    const { client } = await renderWithProviders(<CheckoutScreen />);
    await fireEvent.press(await screen.findByText('Nakit'));
    await fireEvent.press(await screen.findByText('Siparişi onayla · ₺150,00'));
    await waitFor(() => expect(initialize).toHaveBeenCalledWith({ cartId: 'c1', branchId: 'b1', brandId: 'r1', paymentMethod: 'CASH', orderType: 'PICKUP', creditUsedAmount: 0 }));
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/orders/[id]', params: { id: 'o1', branchId: 'b1', brandId: 'r1', placed: '1' } }),
    );
    await settled(client);
  });

  it('hands a card payment to the payment screen', async () => {
    setup();
    jest.spyOn(payments, 'initializePayment').mockResolvedValue({ paymentId: 'p1', paymentUrl: 'https://pay.example/1' });
    const { client } = await renderWithProviders(<CheckoutScreen />);
    await fireEvent.press(await screen.findByText('Siparişi onayla · ₺150,00'));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/payment'));
    expect(getPendingPayment()).toMatchObject({ paymentId: 'p1', cartId: 'c1', branchId: 'b1', brandId: 'r1', paymentUrl: 'https://pay.example/1' });
    expect(mockReplace).not.toHaveBeenCalled();
    await settled(client);
  });

  it('reads the order id from the payment record when the answer has none', async () => {
    setup();
    jest.spyOn(payments, 'initializePayment').mockResolvedValue({ paymentId: 'p1' });
    jest.spyOn(payments, 'waitForPayment').mockResolvedValue({ id: 'p1', status: 'SUCCESS', orderId: 'o9', branchId: 'b1', brandId: 'r1' });
    const { client } = await renderWithProviders(<CheckoutScreen />);
    await fireEvent.press(await screen.findByText('Nakit'));
    await fireEvent.press(await screen.findByText(/Siparişi onayla/));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ params: expect.objectContaining({ id: 'o9' }) })));
    await settled(client);
  });

  it('spends the credit up to the total on a delivery order and sends the note', async () => {
    setup({ branch: { order_type_settings: enabled('delivery') }, credit: 40 });
    const initialize = jest.spyOn(payments, 'initializePayment').mockResolvedValue({ paymentId: 'p1', paymentUrl: 'https://pay.example/1' });
    const { client } = await renderWithProviders(<CheckoutScreen />);
    await fireEvent(await screen.findByLabelText('Kredimi kullan (₺40,00)'), 'valueChange', true);
    await fireEvent.changeText(screen.getByLabelText('Not'), ' kapıyı çalma ');
    await fireEvent.press(await screen.findByText('Siparişi onayla · ₺110,00'));
    await waitFor(() =>
      expect(initialize).toHaveBeenCalledWith({ cartId: 'c1', branchId: 'b1', brandId: 'r1', paymentMethod: 'ONLINE_CARD', orderType: 'DELIVERY', creditUsedAmount: 40, note: 'kapıyı çalma' }),
    );
    await settled(client);
  });

  it('asks for an address before a delivery order', async () => {
    mockActiveAddress = null;
    setup({ branch: { order_type_settings: enabled('delivery') } });
    const initialize = jest.spyOn(payments, 'initializePayment');
    await renderWithProviders(<CheckoutScreen />);
    await fireEvent.press(await screen.findByText(/Siparişi onayla/));
    expect(await screen.findAllByText('Teslimat adresi seç.')).not.toHaveLength(0);
    expect(initialize).not.toHaveBeenCalled();
  });

  it('needs a time for a scheduled order and sends the one picked as the API gave it', async () => {
    setup({ branch: { order_type_settings: enabled('scheduledPickup') } });
    jest.spyOn(branches, 'getFulfillmentSlots').mockResolvedValue({
      orderType: 'SCHEDULED_PICKUP',
      available: true,
      dates: [{ date: '2026-10-22', slots: [{ label: '12:00', value: 'opaque-slot-1' }, { label: '12:30', value: 'opaque-slot-2' }] }],
    });
    const initialize = jest.spyOn(payments, 'initializePayment').mockResolvedValue({ paymentId: 'p1', paymentUrl: 'https://pay.example/1' });
    const { client } = await renderWithProviders(<CheckoutScreen />);
    await fireEvent.press(await screen.findByText(/Siparişi onayla/));
    expect(await screen.findByText('Bir saat seç.')).toBeTruthy();
    expect(initialize).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('12:30'));
    await fireEvent.press(screen.getByText(/Siparişi onayla/));
    await waitFor(() => expect(initialize).toHaveBeenCalledWith(expect.objectContaining({ orderType: 'SCHEDULED_PICKUP', scheduledFor: 'opaque-slot-2', paymentMethod: 'ONLINE_CARD' })));
    await settled(client);
  });

  it('does not order when the branch closed in the meantime', async () => {
    setup();
    const initialize = jest.spyOn(payments, 'initializePayment');
    const { client } = await renderWithProviders(<CheckoutScreen />);
    const button = await screen.findByText(/Siparişi onayla/);
    jest.spyOn(branches, 'getBranchAvailability').mockResolvedValue({ canAcceptOrders: false, reason: 'Kurye yok' });
    await fireEvent.press(button);
    expect(await screen.findByText('Kurye yok')).toBeTruthy();
    expect(initialize).not.toHaveBeenCalled();
    await settled(client);
  });
});
