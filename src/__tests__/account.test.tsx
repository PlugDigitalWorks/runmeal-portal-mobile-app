import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Account from '@/app/account';
import { changeLanguage } from '@/lib/language';
import { getCreditBalance } from '@/services/loyalty.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockSignOut = jest.fn(async () => undefined);
let mockShowMocks = true;
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p), navigate: (p: unknown) => mockNavigate(p), replace: (p: unknown) => mockReplace(p) } }));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0', nativeBuildVersion: '7' }));
jest.mock('@/config', () => {
  const config = { ...jest.requireActual('@/config') };
  Object.defineProperty(config, 'SHOW_MOCKS', { get: () => mockShowMocks });
  return config;
});
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { firstName: 'Ada', lastName: 'Yılmaz', email: 'ada@example.com' }, signOut: mockSignOut }),
}));
jest.mock('@/services/loyalty.service', () => ({ getCreditBalance: jest.fn() }));
jest.mock('@/lib/language', () => ({ ...jest.requireActual('@/lib/language'), changeLanguage: jest.fn(async () => undefined) }));

/** Waits for the credit pill so no query update lands after the test ends. */
async function renderAccount() {
  const view = await renderWithProviders(<Account />);
  await screen.findByText(/^Runmeal kredisi/);
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockShowMocks = true;
  (getCreditBalance as jest.Mock).mockResolvedValue(12.5);
});

it('shows who is signed in with the real credit balance', async () => {
  await renderAccount();
  expect(screen.getByText('Ada Yılmaz')).toBeTruthy();
  expect(screen.getByText('ada@example.com')).toBeTruthy();
  expect(await screen.findByText('Runmeal kredisi ₺12,50')).toBeTruthy();
  expect(screen.getByText('v1.0.0 (7)')).toBeTruthy();
});

it('shows ₺0 when the account has no credit', async () => {
  (getCreditBalance as jest.Mock).mockResolvedValue(0);
  await renderAccount();
  expect(await screen.findByText('Runmeal kredisi ₺0,00')).toBeTruthy();
});

it('tags every demo row with Mock', async () => {
  await renderAccount();
  // Plus pill, cards, coupons, email, notifications and feedback.
  expect(screen.getAllByText('Mock')).toHaveLength(6);
  expect(screen.getByText('YENİ')).toBeTruthy();
});

it('drops the demo rows when mocks are off but keeps the real ones', async () => {
  mockShowMocks = false;
  await renderAccount();
  for (const hidden of ['Kayıtlı kartlarım', 'E-posta değişikliği', 'Bildirim tercihlerim', 'Runmeal seni dinliyor']) expect(screen.queryByText(hidden)).toBeNull();
  expect(screen.queryByText('Mock')).toBeNull();
  for (const shown of ['Kullanıcı bilgilerim', 'Adreslerim', 'İndirim kuponlarım', 'Ödüllerim', 'Güvenlik', 'Daha fazla']) expect(screen.getByText(shown)).toBeTruthy();
});

it('opens the sub screens and the tabs', async () => {
  await renderAccount();
  await fireEvent.press(screen.getByText('Kullanıcı bilgilerim'));
  expect(mockPush).toHaveBeenLastCalledWith('/account/profile');
  await fireEvent.press(screen.getByText('Adreslerim'));
  expect(mockPush).toHaveBeenLastCalledWith('/addresses');
  await fireEvent.press(screen.getByText('Ödüllerim'));
  expect(mockPush).toHaveBeenLastCalledWith('/rewards');
  await fireEvent.press(screen.getByText('Güvenlik'));
  expect(mockPush).toHaveBeenLastCalledWith('/account/security');
  await fireEvent.press(screen.getByText('Favorilerim'));
  expect(mockNavigate).toHaveBeenLastCalledWith('/(tabs)/favorites');
  await fireEvent.press(screen.getByText('Siparişlerim'));
  expect(mockNavigate).toHaveBeenLastCalledWith('/(tabs)/orders');
});

it('changes the language from the sheet', async () => {
  await renderAccount();
  expect(screen.getByText('Türkçe')).toBeTruthy();
  await fireEvent.press(screen.getByText('Dil'));
  await fireEvent.press(screen.getByTestId('language-en'));
  await waitFor(() => expect(changeLanguage).toHaveBeenCalledWith('en'));
});

it('asks before signing out, then goes to the login screen', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await renderAccount();
  await fireEvent.press(screen.getByText('Çıkış yap'));
  expect(mockSignOut).not.toHaveBeenCalled();
  const buttons = alert.mock.calls[0][2] as { style?: string; onPress?: () => void }[];
  await buttons.find((b) => b.style === 'destructive')!.onPress!();
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/login'));
  expect(mockSignOut).toHaveBeenCalled();
});
