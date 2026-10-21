import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import DeleteAccountScreen from '@/app/delete-account';
import { expireSession } from '@/lib/api';
import { getTokens } from '@/lib/session';
import { deleteAccount } from '@/services/auth.service';
import { renderWithProviders } from './helpers/render-with-providers';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() } }));
const mockForget = jest.fn(async () => undefined);
let mockUser: { email: string; role: string; isGuest?: boolean } = { email: 'ada@example.com', role: 'customer' };
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: mockUser, forgetDeletedAccount: mockForget }) }));
jest.mock('@/services/auth.service', () => ({ deleteAccount: jest.fn() }));
jest.mock('@/lib/api', () => ({ expireSession: jest.fn(async () => undefined) }));
jest.mock('@/lib/session', () => ({ getTokens: jest.fn() }));

const apiError = (status: number | null, code?: string) =>
  Object.assign(new Error('request failed'), {
    isAxiosError: true,
    response: status === null ? undefined : { status, data: { success: false, message: 'internal detail', code, statusCode: status } },
  });

const destructive = (alert: jest.SpyInstance) =>
  alert.mock.calls[0][2].find((b: { style?: string }) => b.style === 'destructive');

async function confirmDelete() {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await fireEvent.press(screen.getByTestId('delete-account'));
  // Not awaited: an in-flight delete would hold `act` open.
  await act(async () => {
    void destructive(alert).onPress();
  });
  return alert;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = { email: 'ada@example.com', role: 'customer' };
  (getTokens as jest.Mock).mockReturnValue({ accessToken: 'a', refreshToken: 'r', sid: 's' });
});

it('sends nothing when the confirmation is cancelled', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderWithProviders(<DeleteAccountScreen />);
  await fireEvent.press(screen.getByTestId('delete-account'));
  expect(alert).toHaveBeenCalledWith('Hesabın silinsin mi?', expect.stringContaining('Geçmiş sipariş ve ödeme kayıtların korunur'), expect.any(Array));
  const buttons = alert.mock.calls[0][2] as { style?: string; onPress?: () => void }[];
  buttons.find((b) => b.style === 'cancel')?.onPress?.();
  expect(deleteAccount).not.toHaveBeenCalled();
  expect(mockForget).not.toHaveBeenCalled();
});

it('explains what happens before asking', async () => {
  await renderWithProviders(<DeleteAccountScreen />);
  expect(screen.getByText('ada@example.com hesabıyla giriş yaptın.')).toBeTruthy();
  expect(screen.getByText(/kalıcı olarak kapatılır/)).toBeTruthy();
  expect(screen.getByText(/Geçmiş sipariş ve ödeme kayıtların yasal zorunluluk nedeniyle korunur/)).toBeTruthy();
  expect(screen.getByText(/güncellenmesi biraz zaman alabilir/)).toBeTruthy();
});

it('deletes once after the yes, forgets the account locally and lands on sign-in', async () => {
  (deleteAccount as jest.Mock).mockResolvedValue(undefined);
  await renderWithProviders(<DeleteAccountScreen />);
  const alert = await confirmDelete();

  await waitFor(() => expect(mockForget).toHaveBeenCalledTimes(1));
  expect(deleteAccount).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
  expect(alert).toHaveBeenLastCalledWith('Hesap silindi', 'Hesabın kapatıldı.');
});

it('shows progress and ignores a second yes while the delete is in flight', async () => {
  let finish: () => void = () => {};
  (deleteAccount as jest.Mock).mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
  await renderWithProviders(<DeleteAccountScreen />);
  const alert = await confirmDelete();

  expect(screen.getByText('Siliniyor…')).toBeTruthy();
  expect(screen.getByTestId('delete-account').props.accessibilityState).toMatchObject({ busy: true, disabled: true });
  await act(async () => {
    void destructive(alert).onPress();
  });
  expect(deleteAccount).toHaveBeenCalledTimes(1);

  await act(async () => finish());
  await waitFor(() => expect(mockForget).toHaveBeenCalledTimes(1));
});

it.each([
  ['USER_ACCOUNT_DELETE_BALANCE_REMAINING', 409, 'Hesabınızı silmeden önce cüzdan bakiyenizin kapatılması gerekiyor.'],
  ['USER_ACCOUNT_DELETE_ACTIVE_OPERATION', 409, 'Hesabınızı silmeden önce aktif siparişlerinizin ve bekleyen ödemelerinizin tamamlanması gerekiyor.'],
  ['USER_ACCOUNT_DELETE_PROVIDER_UNAVAILABLE', 503, 'Hesabınız silinemedi. Lütfen daha sonra tekrar deneyin.'],
])('keeps the session on %s and lets the person try again', async (code, status, message) => {
  (deleteAccount as jest.Mock).mockRejectedValueOnce(apiError(status, code)).mockResolvedValueOnce(undefined);
  await renderWithProviders(<DeleteAccountScreen />);
  await confirmDelete();

  expect(await screen.findByText(message)).toBeTruthy();
  expect(screen.queryByText('internal detail')).toBeNull();
  expect(mockForget).not.toHaveBeenCalled();
  expect(expireSession).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();

  await confirmDelete();
  await waitFor(() => expect(mockForget).toHaveBeenCalledTimes(1));
  expect(deleteAccount).toHaveBeenCalledTimes(2);
});

it('hands a 401 to the session-expired flow without claiming a deletion', async () => {
  (deleteAccount as jest.Mock).mockRejectedValue(apiError(401, 'UNAUTHORIZED'));
  await renderWithProviders(<DeleteAccountScreen />);
  const alert = await confirmDelete();

  await waitFor(() => expect(expireSession).toHaveBeenCalledTimes(1));
  expect(mockForget).not.toHaveBeenCalled();
  expect(alert).not.toHaveBeenCalledWith('Hesap silindi', expect.anything());
});

it('stays quiet when a rejected refresh already ended the session', async () => {
  (deleteAccount as jest.Mock).mockRejectedValue(apiError(400, 'INVALID_REFRESH_TOKEN'));
  (getTokens as jest.Mock).mockReturnValue(null);
  await renderWithProviders(<DeleteAccountScreen />);
  await confirmDelete();

  await waitFor(() => expect(screen.getByText('Hesabımı sil')).toBeTruthy());
  expect(expireSession).not.toHaveBeenCalled();
  expect(mockForget).not.toHaveBeenCalled();
  expect(screen.queryByText('Hesabın silinemedi. Tekrar dene.')).toBeNull();
});

it('shows a 403 as a permission error and keeps the session', async () => {
  (deleteAccount as jest.Mock).mockRejectedValue(apiError(403, 'FORBIDDEN'));
  await renderWithProviders(<DeleteAccountScreen />);
  await confirmDelete();
  expect(await screen.findByText('Bu hesapla bu işlem yapılamıyor.')).toBeTruthy();
  expect(mockForget).not.toHaveBeenCalled();
});

it('says the outcome is unknown when the answer never arrives, and does not resend', async () => {
  (deleteAccount as jest.Mock).mockRejectedValue(apiError(null));
  await renderWithProviders(<DeleteAccountScreen />);
  const alert = await confirmDelete();

  expect(await screen.findByText(/hesabının silinip silinmediğini doğrulayamadık/)).toBeTruthy();
  expect(deleteAccount).toHaveBeenCalledTimes(1);
  expect(mockForget).not.toHaveBeenCalled();
  expect(alert).not.toHaveBeenCalledWith('Hesap silindi', expect.anything());
});

it('reports any other failure plainly', async () => {
  (deleteAccount as jest.Mock).mockRejectedValue(apiError(500, 'INTERNAL_SERVER_ERROR'));
  await renderWithProviders(<DeleteAccountScreen />);
  await confirmDelete();
  expect(await screen.findByText('Hesabın silinemedi. Tekrar dene.')).toBeTruthy();
  expect(screen.queryByText('internal detail')).toBeNull();
});

it('offers no deletion to an account that is not a customer', async () => {
  mockUser = { email: 'boss@example.com', role: 'manager' };
  await renderWithProviders(<DeleteAccountScreen />);
  expect(screen.queryByTestId('delete-account')).toBeNull();
  expect(screen.getByText('Bu hesap uygulamadan silinemez.')).toBeTruthy();
});
