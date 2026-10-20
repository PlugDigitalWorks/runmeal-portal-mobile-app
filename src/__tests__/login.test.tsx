import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import '@/i18n';
import Login from '@/app/(auth)/login';
import * as auth from '@/services/auth.service';

// The widget solves itself on mount unless a test switches that off; mounts are counted.
let mockSolve = true;
let mockMounts = 0;
jest.mock('@/components/Recaptcha', () => {
  const { useEffect } = jest.requireActual('react');
  return {
    Recaptcha: ({ onToken }: { onToken: (t: string) => void }) => {
      useEffect(() => {
        mockMounts += 1;
        if (mockSolve) onToken('cap');
      }, [onToken]);
      return null;
    },
  };
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
  mockSolve = true;
  mockMounts = 0;
  jest.restoreAllMocks();
  jest.mocked(router.push).mockClear();
});

it('does not ask for a captcha or call the API when the email is invalid', async () => {
  const spy = jest.spyOn(auth, 'requestOtpLogin').mockResolvedValue();
  await render(<Login />);
  await fireEvent.changeText(screen.getByPlaceholderText('ornek@eposta.com'), 'nope');
  await fireEvent.press(screen.getByText('Kod gönder'));
  expect(screen.getByText('Geçerli bir e-posta adresi gir.')).toBeTruthy();
  expect(mockMounts).toBe(0);
  expect(spy).not.toHaveBeenCalled();
});

it('sends nothing when the captcha sheet is closed unsolved', async () => {
  mockSolve = false;
  const spy = jest.spyOn(auth, 'requestOtpLogin').mockResolvedValue();
  await render(<Login />);
  await fireEvent.changeText(screen.getByPlaceholderText('ornek@eposta.com'), 'e@x.com');
  // The handler waits on the sheet, so awaiting the press would wait for the test itself.
  void fireEvent.press(screen.getByText('Kod gönder'));
  await waitFor(() => expect(mockMounts).toBe(1));
  await fireEvent.press(screen.getByText('Kapat'));
  expect(spy).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
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
