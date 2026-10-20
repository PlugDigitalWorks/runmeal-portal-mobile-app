import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import Favorites from '@/app/(tabs)/favorites';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (p: unknown) => mockPush(p) } }));

const saved = (id: string, name: string) => ({ id, name, logoUrl: null, bannerUrls: null, addressText: 'Kadıköy' });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

it('lists the favourite restaurants and opens one', async () => {
  await AsyncStorage.setItem('rm_favorites', JSON.stringify([saved('a', 'Artisan Pizza House'), saved('b', 'Premium Burger Co')]));
  await renderWithProviders(<Favorites />);
  expect(await screen.findByText('Artisan Pizza House')).toBeTruthy();
  expect(screen.getByText('Premium Burger Co')).toBeTruthy();
  await fireEvent.press(screen.getByText('Premium Burger Co'));
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/restaurant/[branchId]', params: { branchId: 'b' } });
});

it('removes a restaurant with its heart', async () => {
  await AsyncStorage.setItem('rm_favorites', JSON.stringify([saved('a', 'Artisan Pizza House')]));
  await renderWithProviders(<Favorites />);
  await fireEvent.press(await screen.findByLabelText('Favorilerden çıkar'));
  await waitFor(() => expect(screen.getByText('Henüz favorin yok')).toBeTruthy());
});

it('shows the empty state when there are none', async () => {
  await renderWithProviders(<Favorites />);
  expect(await screen.findByText('Henüz favorin yok')).toBeTruthy();
  expect(screen.getByText('Beğendiğin restoranların kalbine dokun, burada toplansın.')).toBeTruthy();
});
