import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import '@/i18n';
import Login from '@/app/(auth)/login';
import * as auth from '@/services/auth.service';

jest.mock('@/components/Recaptcha', () => {
  const { useEffect } = jest.requireActual('react');
  return { Recaptcha: ({ onToken }: { onToken: (t: string) => void }) => { useEffect(() => onToken('cap'), [onToken]); return null; } };
});
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() }, Link: ({ children }: { children: unknown }) => children }));
// Social flags default to on; a test turns them off through these.
let mockSocialOn = true;
jest.mock('@/config', () => {
  const config = { ...jest.requireActual('@/config') };
  for (const flag of ['SIGN_IN_GOOGLE', 'SIGN_IN_APPLE']) Object.defineProperty(config, flag, { get: () => mockSocialOn });
  return config;
});
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ signIn: jest.fn() }) }));

it('sends an OTP and opens the code screen', async () => {
  const spy = jest.spyOn(auth, 'requestOtpLogin').mockResolvedValue();
  await render(<Login />);
  await fireEvent.changeText(screen.getByPlaceholderText('ornek@eposta.com'), 'e@x.com');
  await fireEvent.press(screen.getByText('Kod gönder'));
  await waitFor(() => expect(spy).toHaveBeenCalledWith('e@x.com', 'cap'));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/(auth)/verify', params: { email: 'e@x.com', mode: 'login' } });
});

beforeEach(() => {
  mockSocialOn = true;
});

it('shows Google below the email form by default', async () => {
  await render(<Login />);
  expect(screen.getByText('Google ile devam et')).toBeTruthy();
  expect(screen.queryByText(/Apple/)).toBeNull();
});

it('hides the social buttons when both flags are off', async () => {
  mockSocialOn = false;
  await render(<Login />);
  expect(screen.queryByText(/Google/)).toBeNull();
  expect(screen.queryByText(/Apple/)).toBeNull();
});
