import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import '@/i18n';
import { SocialSignIn } from '@/components/SocialSignIn';
import { loginWithGoogle } from '@/services/auth.service';

// The iOS client id is the one value the tests vary; a getter lets each test pick it.
let mockIosClientId = '';
jest.mock('@/config', () => {
  const config = { ...jest.requireActual('@/config') };
  Object.defineProperty(config, 'GOOGLE_IOS_CLIENT_ID', { get: () => mockIosClientId });
  return config;
});
jest.mock('@/services/auth.service', () => ({ loginWithApple: jest.fn(), loginWithGoogle: jest.fn() }));

const auth = { accessToken: 'a', refreshToken: 'r', sid: 's', user: { id: 'u1' } };

beforeEach(() => {
  jest.clearAllMocks();
  mockIosClientId = '';
  (loginWithGoogle as jest.Mock).mockResolvedValue(auth);
});

it('shows the Google button with the default flags and keeps Apple hidden without the capability', async () => {
  await render(<SocialSignIn onSignedIn={jest.fn()} onError={jest.fn()} />);
  expect(screen.getByText('Google ile devam et')).toBeTruthy();
  expect(screen.getByText('veya')).toBeTruthy();
  expect(screen.queryByText(/Apple/)).toBeNull();
});

it('explains instead of calling the native SDK on iOS while the iOS client id is empty', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  await render(<SocialSignIn onSignedIn={jest.fn()} onError={jest.fn()} />);
  await fireEvent.press(screen.getByText('Google ile devam et'));
  expect(alert).toHaveBeenCalledWith('Google girişi hazır değil', expect.stringContaining('henüz yapılandırılmadı'));
  expect(GoogleSignin.signIn).not.toHaveBeenCalled();
  expect(loginWithGoogle).not.toHaveBeenCalled();
});

it('signs in with Google through the native sheet and the API once the iOS client id is set', async () => {
  mockIosClientId = 'x.apps.googleusercontent.com';
  (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ type: 'success', data: { idToken: 'google-jwt', user: {} } });
  const onSignedIn = jest.fn();
  await render(<SocialSignIn onSignedIn={onSignedIn} onError={jest.fn()} />);
  await fireEvent.press(screen.getByText('Google ile devam et'));
  await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith(auth));
  expect(loginWithGoogle).toHaveBeenCalledWith('google-jwt');
  expect(GoogleSignin.configure).toHaveBeenCalledWith(expect.objectContaining({ iosClientId: 'x.apps.googleusercontent.com' }));
});

it('reports a Google token the API refuses', async () => {
  mockIosClientId = 'x.apps.googleusercontent.com';
  (GoogleSignin.signIn as jest.Mock).mockResolvedValue({ type: 'success', data: { idToken: 'google-jwt', user: {} } });
  const refusal = Object.assign(new Error('401'), { response: { status: 401 } });
  (loginWithGoogle as jest.Mock).mockRejectedValue(refusal);
  const onError = jest.fn();
  await render(<SocialSignIn onSignedIn={jest.fn()} onError={onError} />);
  await fireEvent.press(screen.getByText('Google ile devam et'));
  await waitFor(() => expect(onError).toHaveBeenCalledWith(refusal));
});
