import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { LocationProvider, useLocation } from '@/context/LocationContext';
import { qk } from '@/queries/keys';
import { getAddresses, setActiveAddress } from '@/services/address.service';
import type { Address } from '@/types/address';
import { renderWithProviders } from './helpers/render-with-providers';

jest.mock('@/context/AuthContext', () => ({ useAuth: () => ({ status: 'signedIn' }) }));
jest.mock('@/services/address.service', () => ({ getAddresses: jest.fn(), setActiveAddress: jest.fn() }));

const address = (over: Partial<Address>): Address => ({ id: 'a1', street: 'Moda Cd.', isActive: false, latitude: 40.99, longitude: 29.03, ...over }) as Address;

function Probe() {
  const location = useLocation();
  return (
    <Pressable testID="select-a2" onPress={() => location.selectAddress('a2')}>
      <Text>{`${location.activeAddress?.id ?? 'none'}|${location.coords?.latitude ?? 'none'}|${location.isLoading}`}</Text>
    </Pressable>
  );
}

beforeEach(() => jest.clearAllMocks());

it('uses the address the API marks active, with its coordinates', async () => {
  (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1' }), address({ id: 'a2', isActive: true, latitude: 41.1 })]);
  await renderWithProviders(<LocationProvider><Probe /></LocationProvider>);
  expect(await screen.findByText('a2|41.1|false')).toBeTruthy();
});

it('falls back to the first address when none is marked active', async () => {
  (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1' }), address({ id: 'a2' })]);
  await renderWithProviders(<LocationProvider><Probe /></LocationProvider>);
  expect(await screen.findByText('a1|40.99|false')).toBeTruthy();
});

it('has no active address when the person has none', async () => {
  (getAddresses as jest.Mock).mockResolvedValue([]);
  await renderWithProviders(<LocationProvider><Probe /></LocationProvider>);
  expect(await screen.findByText('none|none|false')).toBeTruthy();
});

it('selecting an address activates it and refreshes the addresses and the nearby feed', async () => {
  (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true }), address({ id: 'a2' })]);
  (setActiveAddress as jest.Mock).mockResolvedValue(undefined);
  const { client } = await renderWithProviders(<LocationProvider><Probe /></LocationProvider>);
  await screen.findByText('a1|40.99|false');
  const invalidate = jest.spyOn(client, 'invalidateQueries');

  await fireEvent.press(screen.getByTestId('select-a2'));
  await waitFor(() => expect(setActiveAddress).toHaveBeenCalledWith('a2'));
  await waitFor(() => expect(getAddresses).toHaveBeenCalledTimes(2));
  expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.addresses });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['nearby'] });
});
