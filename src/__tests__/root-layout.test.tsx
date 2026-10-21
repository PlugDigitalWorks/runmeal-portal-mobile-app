import { Stack } from 'expo-router';
import { act, renderRouter, screen } from 'expo-router/testing-library';
import * as SplashScreen from 'expo-splash-screen';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import RootLayout from '@/app/_layout';

type Status = 'loading' | 'signedOut' | 'signedIn';
let mockStatus: Status = 'signedIn';
let mockSetStatus: ((next: Status) => void) | null = null;

jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(async () => {}), hideAsync: jest.fn(async () => {}) }));
// The real providers read the Keychain and the API; the layout only needs the auth status, which the test drives.
jest.mock('@/context/AuthContext', () => {
  const { createContext, createElement, useContext, useState } = jest.requireActual('react');
  const StatusContext = createContext('loading');
  return {
    AuthProvider: ({ children }: { children: ReactNode }) => {
      const [status, setStatus] = useState(mockStatus);
      mockSetStatus = setStatus;
      return createElement(StatusContext.Provider, { value: status }, children);
    },
    useAuth: () => ({ status: useContext(StatusContext) }),
  };
});
jest.mock('@/context/LocationContext', () => ({ LocationProvider: ({ children }: { children: ReactNode }) => children }));
jest.mock('@/context/HomeViewContext', () => ({ HomeViewProvider: ({ children }: { children: ReactNode }) => children }));

const stub = (name: string) =>
  function Stub() {
    return <Text>{`${name} screen`}</Text>;
  };
const nested = () =>
  function NestedStack() {
    return <Stack screenOptions={{ headerShown: false }} />;
  };
/** Every screen the root stack names, as stubs, so the real layout renders without route warnings. */
const routes = {
  _layout: RootLayout,
  index: stub('index'),
  '(auth)/_layout': nested(),
  '(auth)/login': stub('login'),
  '(tabs)/_layout': nested(),
  '(tabs)/index': stub('home'),
  ...Object.fromEntries(
    [
      'onboarding/address', 'addresses/index', 'addresses/form', 'cart', 'checkout', 'payment', 'restaurants', 'search', 'deals', 'account',
      'account/profile', 'account/cards', 'account/coupons', 'account/email', 'account/notifications', 'account/feedback', 'account/security',
      'account/more', 'orders/[id]', 'rewards', 'legal/[page]', 'delete-account', 'campaigns/[id]', 'restaurant/[branchId]', 'product/[id]',
    ].map((name) => [name, stub(name)]),
  ),
};

async function setStatus(next: Status) {
  await act(async () => mockSetStatus?.(next));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStatus = 'signedIn';
});

it('ends on sign-in when the session expires on a pushed stack screen', async () => {
  await renderRouter(routes, { initialUrl: '/restaurant/b1' });
  expect(await screen.findByText('restaurant/[branchId] screen')).toBeTruthy();
  await setStatus('signedOut');
  expect(await screen.findByText('login screen')).toBeTruthy();
  expect(screen.queryByText('restaurant/[branchId] screen')).toBeNull();
});

it('keeps signed-out people off the signed-in screens', async () => {
  mockStatus = 'signedOut';
  await renderRouter(routes, { initialUrl: '/checkout' });
  expect(await screen.findByText('login screen')).toBeTruthy();
});

it('hides the splash for a deep link once the auth status is known', async () => {
  mockStatus = 'loading';
  await renderRouter(routes, { initialUrl: '/restaurant/b1' });
  expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
  await setStatus('signedIn');
  expect(await screen.findByText('restaurant/[branchId] screen')).toBeTruthy();
  expect(SplashScreen.hideAsync).toHaveBeenCalled();
});
