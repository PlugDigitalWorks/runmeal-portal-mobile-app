import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { clearSession, loadSession } from '@/lib/session';

jest.mock('@/lib/session', () => ({ loadSession: jest.fn(), clearSession: jest.fn(async () => {}), saveSession: jest.fn(), saveUser: jest.fn() }));
jest.mock('@/services/profile.service', () => ({ getProfile: jest.fn() }));

function Probe() {
  return <Text>{useAuth().status}</Text>;
}

it('starts signed out on a clean slate when the stored session cannot be read', async () => {
  (loadSession as jest.Mock).mockRejectedValue(new Error('Keychain unavailable'));
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  expect(await screen.findByText('signedOut')).toBeTruthy();
  expect(clearSession).toHaveBeenCalled();
});
