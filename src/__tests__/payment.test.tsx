import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import PaymentScreen from '@/app/payment';
import { getPendingPayment, setPendingPayment } from '@/lib/pending-payment';
import * as payments from '@/services/payment.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockReplace = jest.fn();
let webViewProps: { onShouldStartLoadWithRequest: (r: { url: string }) => boolean; source: unknown };

jest.mock('expo-router', () => ({ router: { replace: (p: unknown) => mockReplace(p) } }));
jest.mock('react-native-webview', () => ({
  WebView: (props: typeof webViewProps) => {
    webViewProps = props;
    return null;
  },
}));

const CALLBACK = 'https://staging-portalfe.runmeal.com/payment/callback';
/** The WebView asks before every load; its state updates belong inside act like any other event. */
async function navigate(url: string): Promise<boolean> {
  let allowed = true;
  await act(async () => {
    allowed = webViewProps.onShouldStartLoadWithRequest({ url });
  });
  return allowed;
}

const record = (extra: object = {}) => ({ id: 'p1', status: 'SUCCESS', orderId: 'o1', branchId: 'b1', brandId: 'r1', ...extra });
const order = (id: string) => ({ pathname: '/orders/[id]', params: { id, branchId: 'b1', brandId: 'r1', placed: '1' } });

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  setPendingPayment({ paymentId: 'p1', branchId: 'b1', brandId: 'r1', cartId: 'c1', paymentUrl: 'https://pay.example/1' });
});

it("opens the provider page and lets the provider's own pages load", async () => {
  await renderWithProviders(<PaymentScreen />);
  expect(webViewProps.source).toEqual({ uri: 'https://pay.example/1' });
  expect(await navigate('https://pay.example/1/3ds')).toBe(true);
});

it('renders an iyzico form against the portal origin', async () => {
  setPendingPayment({ paymentId: 'p1', branchId: 'b1', brandId: 'r1', cartId: 'c1', checkoutFormContent: '<form></form>' });
  await renderWithProviders(<PaymentScreen />);
  expect(webViewProps.source).toEqual({ html: '<form></form>', baseUrl: 'https://staging-portalfe.runmeal.com' });
});

it('stops at the callback, confirms the payment and shows the placed order', async () => {
  const wait = jest.spyOn(payments, 'waitForPayment').mockResolvedValue(record());
  const { client } = await renderWithProviders(<PaymentScreen />);
  const allowed = await navigate(`${CALLBACK}?status=success&paymentId=p1&orderId=o1`);
  expect(allowed).toBe(false);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(order('o1')));
  expect(wait).toHaveBeenCalledWith('p1');
  expect(getPendingPayment()).toBeNull();
  await waitFor(() => expect(client.isFetching()).toBe(0));
});

it("takes the order id from the payment record when the callback has none", async () => {
  jest.spyOn(payments, 'waitForPayment').mockResolvedValue(record({ orderId: 'o7' }));
  await renderWithProviders(<PaymentScreen />);
  await navigate(`${CALLBACK}?status=success&paymentId=p1`);
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(order('o7')));
});

it('shows a retry when the provider reports a failure, without asking the API', async () => {
  const wait = jest.spyOn(payments, 'waitForPayment');
  await renderWithProviders(<PaymentScreen />);
  await navigate(`${CALLBACK}?status=failure&paymentId=p1`);
  expect(await screen.findByText('Ödeme tamamlanamadı')).toBeTruthy();
  expect(wait).not.toHaveBeenCalled();
  expect(mockReplace).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText('Tekrar dene'));
  expect(mockReplace).toHaveBeenCalledWith('/checkout');
  await fireEvent.press(screen.getByText('Sepete dön'));
  expect(mockReplace).toHaveBeenCalledWith('/cart');
});

it('treats a success redirect the record does not back as a failure', async () => {
  jest.spyOn(payments, 'waitForPayment').mockResolvedValue(record({ status: 'FAILED', orderId: null }));
  await renderWithProviders(<PaymentScreen />);
  await navigate(`${CALLBACK}?status=success&paymentId=p1`);
  expect(await screen.findByText('Ödeme tamamlanamadı')).toBeTruthy();
});

describe('closing the payment', () => {
  const closeAndConfirm = async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => buttons?.[1]?.onPress?.());
    await fireEvent.press(await screen.findByLabelText('Ödemeyi kapat'));
    expect(alert).toHaveBeenCalledWith('Ödemeden çıkılsın mı?', expect.any(String), expect.any(Array));
  };

  it('goes back to the cart when nothing was paid', async () => {
    const read = jest.spyOn(payments, 'getPayment').mockResolvedValue(record({ status: 'PENDING', orderId: null }));
    await renderWithProviders(<PaymentScreen />);
    await closeAndConfirm();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/cart'));
    expect(read).toHaveBeenCalledTimes(1);
    expect(getPendingPayment()).toBeNull();
  });

  it('opens the order when the payment went through just before closing', async () => {
    jest.spyOn(payments, 'getPayment').mockResolvedValue(record());
    await renderWithProviders(<PaymentScreen />);
    await closeAndConfirm();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(order('o1')));
  });

  it('stays on the payment when the person keeps paying', async () => {
    const read = jest.spyOn(payments, 'getPayment');
    jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => buttons?.[0]?.onPress?.());
    await renderWithProviders(<PaymentScreen />);
    await fireEvent.press(await screen.findByLabelText('Ödemeyi kapat'));
    expect(read).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
