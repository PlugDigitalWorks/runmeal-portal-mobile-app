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
jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ signIn: jest.fn() }) }));

it('sends an OTP and opens the code screen', async () => {
  const spy = jest.spyOn(auth, 'requestOtpLogin').mockResolvedValue();
  await render(<Login />);
  await fireEvent.changeText(screen.getByPlaceholderText('ornek@eposta.com'), 'e@x.com');
  await fireEvent.press(screen.getByText('Kod gönder'));
  await waitFor(() => expect(spy).toHaveBeenCalledWith('e@x.com', 'cap'));
  expect(router.push).toHaveBeenCalledWith({ pathname: '/(auth)/verify', params: { email: 'e@x.com', mode: 'login' } });
});

it('hides social buttons while the flags are off', async () => {
  await render(<Login />);
  expect(screen.queryByText(/Google/)).toBeNull();
  expect(screen.queryByText(/Apple/)).toBeNull();
});
