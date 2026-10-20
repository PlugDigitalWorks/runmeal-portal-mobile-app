import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CardsScreen from '@/app/account/cards';
import CouponsScreen from '@/app/account/coupons';
import EmailScreen from '@/app/account/email';
import FeedbackScreen from '@/app/account/feedback';
import MoreScreen from '@/app/account/more';
import ProfileScreen from '@/app/account/profile';
import { getCreditBalance } from '@/services/loyalty.service';
import { getProfile } from '@/services/profile.service';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
const mockBack = jest.fn();
let mockShowMocks = true;
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p), back: () => mockBack() } }));
jest.mock('expo-application', () => ({ nativeApplicationVersion: '1.0.0', nativeBuildVersion: '7' }));
jest.mock('@/config', () => {
  const config = { ...jest.requireActual('@/config') };
  Object.defineProperty(config, 'SHOW_MOCKS', { get: () => mockShowMocks });
  return config;
});
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { email: 'ada@example.com' } }) }));
jest.mock('@/services/loyalty.service', () => ({ getCreditBalance: jest.fn() }));
jest.mock('@/services/profile.service', () => ({ getProfile: jest.fn() }));

let alert: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  mockShowMocks = true;
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('shows the real profile read-only; saving an edit only says it is coming', async () => {
  (getProfile as jest.Mock).mockResolvedValue({ id: 'u', email: 'ada@example.com', firstName: 'Ada', lastName: 'Yılmaz', phoneNumber: '+905550000000', role: 'customer' });
  await renderWithProviders(<ProfileScreen />);
  expect(await screen.findByText('Yılmaz')).toBeTruthy();
  for (const text of ['Ada', 'ada@example.com', '+905550000000']) expect(screen.getByText(text)).toBeTruthy();
  await fireEvent.press(screen.getByText('Düzenle'));
  await fireEvent.press(screen.getByText('Kaydet'));
  expect(alert).toHaveBeenCalledWith('Profil güncelleme yakında (Mock)');
});

it('leaves the phone row out when the profile has none', async () => {
  (getProfile as jest.Mock).mockResolvedValue({ id: 'u', email: 'ada@example.com', firstName: 'Ada', lastName: 'Yılmaz', role: 'customer' });
  await renderWithProviders(<ProfileScreen />);
  await screen.findByText('Yılmaz');
  expect(screen.queryByText('Telefon')).toBeNull();
});

it('lists two sample cards, with no card-number field, and the add button only warns', async () => {
  await renderWithProviders(<CardsScreen />);
  expect(screen.getByText('Visa •••• 4242')).toBeTruthy();
  expect(screen.getByText('Mastercard •••• 5454')).toBeTruthy();
  expect(screen.getByText('Varsayılan')).toBeTruthy();
  expect(screen.queryByPlaceholderText(/kart/i)).toBeNull();
  await fireEvent.press(screen.getByText('Kart ekle'));
  expect(alert).toHaveBeenCalledWith('Kart kaydetme ödeme sağlayıcısı entegrasyonuyla gelecek (Mock)');
});

it('shows the real credit above the sample coupons', async () => {
  (getCreditBalance as jest.Mock).mockResolvedValue(25);
  await renderWithProviders(<CouponsScreen />);
  expect(await screen.findByText('Runmeal kredin: ₺25,00')).toBeTruthy();
  expect(screen.getByText('₺175')).toBeTruthy();
  expect(screen.getByText('Alt limit ₺500 · Bitiş 31.10.2026')).toBeTruthy();
  await fireEvent.press(screen.getByText('Ekle'));
  expect(alert).toHaveBeenCalledWith('Kupon ekleme yakında (Mock)');
});

it('hides the sample coupons when mocks are off but keeps the credit', async () => {
  mockShowMocks = false;
  (getCreditBalance as jest.Mock).mockResolvedValue(0);
  await renderWithProviders(<CouponsScreen />);
  expect(await screen.findByText('Runmeal kredin: ₺0,00')).toBeTruthy();
  expect(screen.queryByText('₺175')).toBeNull();
  expect(screen.queryByText('Ekle')).toBeNull();
});

it('only warns when asked to send the email change code', async () => {
  await renderWithProviders(<EmailScreen />);
  expect(screen.getByDisplayValue('ada@example.com')).toBeTruthy();
  await fireEvent.press(screen.getByText('Doğrulama kodu gönder'));
  expect(alert).toHaveBeenCalledWith('Yakında (Mock)');
});

it('thanks for feedback without calling the API, once a mark is picked', async () => {
  await renderWithProviders(<FeedbackScreen />);
  await fireEvent.press(screen.getByText('Gönder'));
  expect(alert).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByTestId('feedback-rate-4'));
  await fireEvent.changeText(screen.getByLabelText('Yorumun'), 'Güzel');
  await fireEvent.press(screen.getByText('Gönder'));
  await waitFor(() => expect(alert).toHaveBeenCalledWith('Teşekkürler (Mock)'));
  expect(mockBack).toHaveBeenCalled();
});

it('links the legal pages and names the company in About', async () => {
  await renderWithProviders(<MoreScreen />);
  await fireEvent.press(screen.getByText('Gizlilik politikası'));
  expect(mockPush).toHaveBeenLastCalledWith('/legal/privacy');
  await fireEvent.press(screen.getByText('Kullanım koşulları'));
  expect(mockPush).toHaveBeenLastCalledWith('/legal/terms');
  expect(screen.getByText('PLUG DIGITAL LTD')).toBeTruthy();
  expect(screen.getByText('v1.0.0 (7)')).toBeTruthy();
  await fireEvent.press(screen.getByText('Yardım merkezi'));
  expect(alert).toHaveBeenCalledWith('Yardım merkezi yakında (Mock)');
});
