import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { Pressable, Text } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { getPendingPayment, setPendingPayment } from '@/lib/pending-payment';
import { queryClient } from '@/lib/query-client';
import { clearSession, getTokens, saveSession } from '@/lib/session';
import { logout } from '@/services/auth.service';
import { getProfile } from '@/services/profile.service';

jest.mock('@/services/profile.service', () => ({ getProfile: jest.fn() }));
jest.mock('@/services/auth.service', () => ({ logout: jest.fn() }));
// The app's client keeps unused data for five minutes, which would hold Jest open.
jest.mock('@/lib/query-client', () => {
  const { QueryClient } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return { queryClient: new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } }) };
});

const user = { id: 'u1', email: 'ada@example.com', firstName: 'Ada', lastName: 'L', role: 'customer' };

function Probe() {
  const { status, forgetDeletedAccount } = useAuth();
  return (
    <Pressable testID="forget" onPress={() => void forgetDeletedAccount()}>
      <Text>{status}</Text>
    </Pressable>
  );
}

beforeEach(async () => {
  jest.clearAllMocks();
  (SecureStore as unknown as { __reset: () => void }).__reset();
  await AsyncStorage.clear();
  await clearSession();
  queryClient.clear();
  await saveSession({ accessToken: 'a1', refreshToken: 'r1', sid: 's1', user });
  await AsyncStorage.multiSet([
    ['rm_favorites', JSON.stringify([{ id: 'b1', name: 'Moda' }])],
    ['rm_recent_searches', JSON.stringify(['pizza'])],
    ['rm_device_id', 'device-1'],
    ['rm_lang', 'en'],
  ]);
  queryClient.setQueryData(['cart'], { id: 'c1' });
  queryClient.setQueryData(['orders'], [{ id: 'o1' }]);
  setPendingPayment({ paymentId: 'p1', branchId: 'b1', brandId: 'br1', cartId: 'c1' });
});

async function press() {
  await fireEvent.press(screen.getByTestId('forget'));
  await act(async () => new Promise((r) => setTimeout(r, 0)));
}

it('forgets the session and every piece of the account on this device, without a logout call', async () => {
  (getProfile as jest.Mock).mockResolvedValue(user);
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  expect(await screen.findByText('signedIn')).toBeTruthy();

  await press();

  expect(await screen.findByText('signedOut')).toBeTruthy();
  expect(getTokens()).toBeNull();
  expect(await SecureStore.getItemAsync('rm_session')).toBeNull();
  expect(await AsyncStorage.getItem('rm_user')).toBeNull();
  expect(await AsyncStorage.getItem('rm_favorites')).toBeNull();
  expect(await AsyncStorage.getItem('rm_recent_searches')).toBeNull();
  expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
  expect(getPendingPayment()).toBeNull();
  expect(logout).not.toHaveBeenCalled();
  // The device's own settings stay.
  expect(await AsyncStorage.getItem('rm_device_id')).toBe('device-1');
  expect(await AsyncStorage.getItem('rm_lang')).toBe('en');
});

it('does not let a profile read that finishes afterwards bring the account back', async () => {
  let answer: (u: typeof user) => void = () => {};
  (getProfile as jest.Mock).mockReturnValue(new Promise((resolve) => (answer = resolve)));
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  expect(await screen.findByText('signedIn')).toBeTruthy();

  await press();
  await act(async () => answer(user));

  expect(screen.getByText('signedOut')).toBeTruthy();
  expect(await AsyncStorage.getItem('rm_user')).toBeNull();
});
