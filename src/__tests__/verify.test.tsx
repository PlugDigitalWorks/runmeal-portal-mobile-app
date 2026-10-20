import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import '@/i18n';
import Verify from '@/app/(auth)/verify';
import * as auth from '@/services/auth.service';

const mockSignIn = jest.fn().mockResolvedValue(undefined);
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({ email: 'e@x.com', mode: 'login' }),
}));
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ signIn: mockSignIn }) }));
jest.mock('@/components/Recaptcha', () => {
  const { useEffect } = jest.requireActual('react');
  return { Recaptcha: ({ onToken }: { onToken: (t: string) => void }) => { useEffect(() => onToken('fresh'), [onToken]); return null; } };
});

it('verifies by itself on the sixth digit, then opens the app', async () => {
  const session = { accessToken: 'a', user: { id: 'u' } } as never;
  const spy = jest.spyOn(auth, 'verifyOtp').mockResolvedValue(session);
  await render(<Verify />);
  await fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '12345');
  expect(spy).not.toHaveBeenCalled();
  await fireEvent.changeText(screen.getByLabelText('Doğrulama kodu'), '123456');
  await waitFor(() => expect(spy).toHaveBeenCalledWith('e@x.com', '123456'));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
  expect(mockSignIn).toHaveBeenCalledWith(session);
});

it('keeps resend locked during the countdown', async () => {
  await render(<Verify />);
  expect(screen.getByText('Kodu tekrar gönder (30 sn)')).toBeTruthy();
});

it('asks for a fresh captcha token when the code is resent', async () => {
  jest.useFakeTimers();
  try {
    const spy = jest.spyOn(auth, 'requestOtpLogin').mockResolvedValue();
    await render(<Verify />);
    // The countdown re-arms its timer every second, so tick it one second at a time.
    for (let i = 0; i < 30; i += 1) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    await fireEvent.press(screen.getByText('Kodu tekrar gönder'));
    await waitFor(() => expect(spy).toHaveBeenCalledWith('e@x.com', 'fresh'));
  } finally {
    jest.useRealTimers();
  }
});
