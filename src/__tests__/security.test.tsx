import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SecurityScreen from '@/app/account/security';
import { api } from '@/lib/api';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSignOut = jest.fn(async () => undefined);
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p), replace: (p: unknown) => mockReplace(p) } }));
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ signOut: mockSignOut }) }));

const calls: { method?: string; url?: string; data?: unknown }[] = [];
let failWith: number | null = null;
beforeEach(() => {
  jest.clearAllMocks();
  calls.length = 0;
  failWith = null;
  api.defaults.adapter = async (config) => {
    calls.push({ method: config.method, url: config.url, data: config.data ? JSON.parse(config.data) : undefined });
    if (failWith) {
      const error = Object.assign(new Error('failed'), { isAxiosError: true, config, response: { status: failWith, data: { message: 'Not allowed' }, headers: {}, config } });
      throw error;
    }
    return { data: { status: true, message: 'ok', data: {} }, status: 200, statusText: 'OK', headers: {}, config };
  };
});

async function fillPasswords(password: string, repeat: string) {
  await fireEvent.changeText(screen.getByLabelText('Yeni şifre'), password);
  await fireEvent.changeText(screen.getByLabelText('Yeni şifre (tekrar)'), repeat);
  await fireEvent.press(screen.getByText('Şifreyi kaydet'));
}

it('sends nothing when the passwords differ or are too short', async () => {
  await renderWithProviders(<SecurityScreen />);
  await fillPasswords('longenough1', 'longenough2');
  expect(await screen.findByText('Şifreler aynı değil.')).toBeTruthy();
  await fillPasswords('short', 'short');
  expect(await screen.findByText('Şifre en az 8 karakter olmalı.')).toBeTruthy();
  expect(calls).toHaveLength(0);
});

it('patches set-password with the password and confirms', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderWithProviders(<SecurityScreen />);
  await fillPasswords('longenough1', 'longenough1');
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Şifren kaydedildi.'));
  expect(calls).toEqual([{ method: 'patch', url: '/auth/set-password', data: { password: 'longenough1' } }]);
});

it('shows the API message when saving fails', async () => {
  failWith = 400;
  await renderWithProviders(<SecurityScreen />);
  await fillPasswords('longenough1', 'longenough1');
  expect(await screen.findByText('Not allowed')).toBeTruthy();
});

it('signs out of every device through the API, then locally', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderWithProviders(<SecurityScreen />);
  await fireEvent.press(screen.getByText('Tüm cihazlardan çıkış yap'));
  expect(calls).toHaveLength(0);
  const buttons = alert.mock.calls[0][2] as { style?: string; onPress?: () => void }[];
  await buttons.find((b) => b.style === 'destructive')!.onPress!();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/login'));
  expect(calls).toEqual([{ method: 'post', url: '/auth/logout-all', data: undefined }]);
  expect(mockSignOut).toHaveBeenCalled();
});

it('stays signed in when logout-all fails', async () => {
  failWith = 500;
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderWithProviders(<SecurityScreen />);
  await fireEvent.press(screen.getByText('Tüm cihazlardan çıkış yap'));
  const buttons = alert.mock.calls[0][2] as { style?: string; onPress?: () => void }[];
  await buttons.find((b) => b.style === 'destructive')!.onPress!();
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Not allowed'));
  expect(mockSignOut).not.toHaveBeenCalled();
});

it('links to account deletion', async () => {
  await renderWithProviders(<SecurityScreen />);
  await fireEvent.press(screen.getByText('Hesabımı sil'));
  expect(mockPush).toHaveBeenCalledWith('/delete-account');
});
