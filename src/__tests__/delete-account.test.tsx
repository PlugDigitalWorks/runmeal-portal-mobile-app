import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import DeleteAccountScreen from '@/app/delete-account';
import { deleteAccount } from '@/services/auth.service';
import { renderWithProviders } from './helpers/render-with-providers';

jest.mock('expo-router', () => ({ router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() } }));
const mockSignOut = jest.fn();
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { email: 'ada@example.com' }, signOut: mockSignOut }) }));
jest.mock('@/services/auth.service', () => ({ deleteAccount: jest.fn() }));

const pressDestructive = (alert: jest.SpyInstance) => {
  const buttons = alert.mock.calls[0][2];
  buttons.find((b: { style?: string }) => b.style === 'destructive').onPress();
};

beforeEach(() => jest.clearAllMocks());

it('deletes only after a second yes, then signs out', async () => {
  (deleteAccount as jest.Mock).mockResolvedValue(undefined);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderWithProviders(<DeleteAccountScreen />);
  expect(screen.getByText('ada@example.com hesabıyla giriş yaptın.')).toBeTruthy();

  await fireEvent.press(screen.getByTestId('delete-account'));
  expect(deleteAccount).not.toHaveBeenCalled();
  pressDestructive(alert);

  await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
  expect(deleteAccount).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledWith('/(auth)/login');
  expect(alert).toHaveBeenLastCalledWith('Hesap silindi', 'Hesabın silindi.');
});

it('explains plainly that deletion is unavailable when the API has no such route', async () => {
  (deleteAccount as jest.Mock).mockRejectedValue(Object.assign(new Error('Not Found'), { isAxiosError: true, response: { status: 404, data: { message: 'Cannot DELETE /profile' } } }));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderWithProviders(<DeleteAccountScreen />);
  await fireEvent.press(screen.getByTestId('delete-account'));
  pressDestructive(alert);
  expect(await screen.findByText('Hesap silme şu an kullanılamıyor, lütfen destekle iletişime geç.')).toBeTruthy();
  expect(screen.queryByText(/Cannot DELETE/)).toBeNull();
  expect(mockSignOut).not.toHaveBeenCalled();
});

it('keeps the customer signed in when the delete fails', async () => {
  (deleteAccount as jest.Mock).mockRejectedValue(new Error('offline'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderWithProviders(<DeleteAccountScreen />);
  await fireEvent.press(screen.getByTestId('delete-account'));
  pressDestructive(alert);

  expect(await screen.findByText('Hesabın silinemedi. Tekrar dene.')).toBeTruthy();
  expect(mockSignOut).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});
