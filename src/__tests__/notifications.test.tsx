import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '@/app/account/notifications';
import { loadNotifPrefs } from '@/lib/notif-prefs';
import { DEFAULT_NOTIF_PREFS } from '@/mocks/account-mocks';
import { renderWithProviders } from './helpers/render-with-providers';

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('starts from the defaults when nothing is saved or the saved value is broken', async () => {
  expect(await loadNotifPrefs()).toEqual(DEFAULT_NOTIF_PREFS);
  await AsyncStorage.setItem('rm_notif_prefs', '{nope');
  expect(await loadNotifPrefs()).toEqual(DEFAULT_NOTIF_PREFS);
});

it('keeps a switch across visits (rm_notif_prefs)', async () => {
  const first = await renderWithProviders(<NotificationsScreen />);
  const campaigns = () => screen.getByTestId('notif-campaigns');
  await waitFor(() => expect(campaigns().props.value).toBe(true));
  await act(async () => {
    fireEvent(campaigns(), 'valueChange', false);
  });
  await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem('rm_notif_prefs')) ?? '{}')).toMatchObject({ campaigns: false, orderStatus: true }));
  await first.unmount();

  await renderWithProviders(<NotificationsScreen />);
  await waitFor(() => expect(screen.getByTestId('notif-campaigns').props.value).toBe(false));
});
