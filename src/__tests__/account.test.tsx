import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import Account from '@/app/account';
import { renderWithProviders } from './helpers/render-with-providers';

const mockReplace = jest.fn();
const mockSignOut = jest.fn(async () => undefined);
jest.mock('expo-router', () => ({ router: { replace: (p: unknown) => mockReplace(p) } }));
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { firstName: 'Ada', lastName: 'Yılmaz', email: 'ada@example.com' }, signOut: mockSignOut }),
}));

it('shows who is signed in and signs out to the login screen', async () => {
  await renderWithProviders(<Account />);
  expect(screen.getByText('Ada Yılmaz')).toBeTruthy();
  expect(screen.getByText('ada@example.com')).toBeTruthy();
  await fireEvent.press(screen.getByText('Çıkış yap'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(auth)/login'));
  expect(mockSignOut).toHaveBeenCalled();
});
