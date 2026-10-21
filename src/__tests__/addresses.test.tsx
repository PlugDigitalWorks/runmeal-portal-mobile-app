import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import AddressesScreen from '@/app/addresses';
import AddressFormScreen from '@/app/addresses/form';
import Index from '@/app/index';
import OnboardingAddress from '@/app/onboarding/address';
import { AddressSheet } from '@/components/AddressSheet';
import { LocationProvider } from '@/context/LocationContext';
import { createAddress, deleteAddress, getAddresses, setActiveAddress, updateAddress } from '@/services/address.service';
import type { Address } from '@/types/address';
import { renderWithProviders } from './helpers/render-with-providers';

const mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => mockParams,
  // Renders the header button so it can be pressed like on screen.
  Stack: { Screen: ({ options }: { options?: { headerRight?: () => unknown } }) => options?.headerRight?.() ?? null },
  Redirect: ({ href }: { href: string }) => {
    const { Text: RNText } = jest.requireActual('react-native');
    return <RNText>{`redirect:${href}`}</RNText>;
  },
}));
const mockAuth = { status: 'signedIn' };
jest.mock('@/context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('@/services/address.service', () => ({
  getAddresses: jest.fn(),
  createAddress: jest.fn(),
  updateAddress: jest.fn(),
  deleteAddress: jest.fn(),
  setActiveAddress: jest.fn(),
}));

const address = (over: Partial<Address>): Address =>
  ({
    id: 'a1',
    countryCode: 'TR',
    province: 'İstanbul',
    district: 'Kadıköy',
    street: 'Moda Cd.',
    buildingNumber: null,
    apartmentNumber: null,
    postalCode: '34710',
    phoneE164: '+905550000000',
    latitude: 40.99,
    longitude: 29.03,
    isActive: false,
    ...over,
  }) as Address;

const withLocation = (ui: ReactElement) => renderWithProviders(<LocationProvider>{ui}</LocationProvider>);

beforeEach(() => {
  jest.clearAllMocks();
  delete mockParams.id;
  mockAuth.status = 'signedIn';
  // mockReset also drops a leftover one-off rejection, which clearAllMocks keeps.
  (setActiveAddress as jest.Mock).mockReset().mockResolvedValue(undefined);
});

describe('my addresses', () => {
  it('ticks the active address and makes another one active on tap', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true }), address({ id: 'a2', street: 'Bağdat Cd.' })]);
    await withLocation(<AddressesScreen />);
    expect(await screen.findByText('Bağdat Cd.')).toBeTruthy();
    expect(screen.getAllByText('Teslimat adresi')).toHaveLength(1);
    expect(screen.getByTestId('address-a1').props.accessibilityState.selected).toBe(true);

    await fireEvent.press(screen.getByTestId('address-a1'));
    expect(setActiveAddress).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('address-a2'));
    await waitFor(() => expect(setActiveAddress).toHaveBeenCalledWith('a2'));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    // The active address is re-read once the change went through.
    await waitFor(() => expect(getAddresses).toHaveBeenCalledTimes(2));
  });

  it('adds a new address from the header button', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true })]);
    await withLocation(<AddressesScreen />);
    await screen.findByTestId('address-a1');
    await fireEvent.press(screen.getAllByLabelText('Yeni adres')[0]);
    expect(router.push).toHaveBeenCalledWith('/addresses/form');
  });

  it('deletes only after the person confirms', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true })]);
    (deleteAddress as jest.Mock).mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await withLocation(<AddressesScreen />);
    await fireEvent.press(await screen.findByLabelText('Sil'));
    expect(deleteAddress).not.toHaveBeenCalled();
    await act(async () => alert.mock.calls[0][2]!.find((b) => b.style === 'destructive')!.onPress!());
    await waitFor(() => expect(deleteAddress).toHaveBeenCalledWith('a1'));
    // The list refetches after the delete.
    await waitFor(() => expect(getAddresses).toHaveBeenCalledTimes(2));
  });

  it('makes the next address active when the active one is deleted', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true }), address({ id: 'a2', street: 'Bağdat Cd.' })]);
    (deleteAddress as jest.Mock).mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await withLocation(<AddressesScreen />);
    await screen.findByText('Bağdat Cd.');
    await fireEvent.press(screen.getAllByLabelText('Sil')[0]);
    await act(async () => alert.mock.calls[0][2]!.find((b) => b.style === 'destructive')!.onPress!());
    await waitFor(() => expect(setActiveAddress).toHaveBeenCalledWith('a2'));
    expect(deleteAddress).toHaveBeenCalledWith('a1');
    expect((deleteAddress as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((setActiveAddress as jest.Mock).mock.invocationCallOrder[0]);
  });

  it('activates nothing when a non-active address is deleted', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true }), address({ id: 'a2', street: 'Bağdat Cd.' })]);
    (deleteAddress as jest.Mock).mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await withLocation(<AddressesScreen />);
    await screen.findByText('Bağdat Cd.');
    await fireEvent.press(screen.getAllByLabelText('Sil')[1]);
    await act(async () => alert.mock.calls[0][2]!.find((b) => b.style === 'destructive')!.onPress!());
    await waitFor(() => expect(getAddresses).toHaveBeenCalledTimes(2));
    expect(deleteAddress).toHaveBeenCalledWith('a2');
    expect(setActiveAddress).not.toHaveBeenCalled();
  });

  it('activates a tapped stand-in address the API does not mark active', async () => {
    // A failing heal leaves the list with none active; tapping the ticked stand-in must still activate it.
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1' })]);
    (setActiveAddress as jest.Mock).mockRejectedValueOnce(new Error('offline'));
    await withLocation(<AddressesScreen />);
    await waitFor(() => expect(setActiveAddress).toHaveBeenCalledTimes(1));
    await fireEvent.press(await screen.findByTestId('address-a1'));
    await waitFor(() => expect(setActiveAddress).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('invites the first address when there are none', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([]);
    await withLocation(<AddressesScreen />);
    expect(await screen.findByText('Henüz adresin yok')).toBeTruthy();
  });
});

describe('address form', () => {
  const fill = async (line: string, postcode: string, phone: string) => {
    await fireEvent.changeText(screen.getByLabelText('Adres'), line);
    await fireEvent.changeText(screen.getByLabelText('Posta kodu'), postcode);
    await fireEvent.changeText(screen.getByLabelText('Telefon'), phone);
  };

  it('shows a field error and saves nothing while the required fields are empty', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([]);
    await withLocation(<AddressFormScreen />);
    await fireEvent.press(screen.getByText('Adresi kaydet'));
    expect(await screen.findByText('Adresini yaz.')).toBeTruthy();
    expect(screen.getByText('Posta kodunu yaz.')).toBeTruthy();
    expect(screen.getByText(/ülke koduyla/)).toBeTruthy();
    expect(createAddress).not.toHaveBeenCalled();
  });

  it('needs a phone with its country code', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([]);
    await withLocation(<AddressFormScreen />);
    await fill('Moda Cd. No: 10', '34710', '0555 000 00 00');
    await fireEvent.press(screen.getByText('Adresi kaydet'));
    expect(await screen.findByText(/ülke koduyla/)).toBeTruthy();
    expect(createAddress).not.toHaveBeenCalled();
  });

  it('adds a geocoded first address, asking the API to make it active', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([]);
    (createAddress as jest.Mock).mockResolvedValue(undefined);
    await withLocation(<AddressFormScreen />);
    // The form must know the list is empty before it can tell this is the first address.
    await waitFor(() => expect(getAddresses).toHaveBeenCalled());
    await fill('Moda Cd. No: 10', '34710', '+90 555 000 00 00');
    await fireEvent.press(screen.getByText('Adresi kaydet'));
    await waitFor(() => expect(createAddress).toHaveBeenCalled());
    expect(Location.geocodeAsync).toHaveBeenCalledWith('Moda Cd. No: 10, 34710');
    expect(createAddress).toHaveBeenCalledWith({
      countryCode: 'TR',
      province: 'İstanbul',
      district: 'Kadıköy',
      street: 'Moda Cd. No: 10',
      postalCode: '34710',
      phoneE164: '+905550000000',
      latitude: 40.9909,
      longitude: 29.0303,
      buildingNumber: null,
      apartmentNumber: null,
      isActive: true,
    });
    // The API answers without the new address, so there is no follow-up set-active call.
    expect(setActiveAddress).not.toHaveBeenCalled();
    await waitFor(() => expect(router.back).toHaveBeenCalled());
  });

  it('fills the address from the phone location and keeps its coordinates', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true })]);
    (createAddress as jest.Mock).mockResolvedValue(undefined);
    (Location.geocodeAsync as jest.Mock).mockClear();
    await withLocation(<AddressFormScreen />);
    await fireEvent.press(screen.getByText('Konumumu kullan'));
    await waitFor(() => expect(screen.getByLabelText('Adres').props.value).toBe('Moda Cd. No: 10'));
    expect(screen.getByLabelText('Posta kodu').props.value).toBe('34710');
    await fireEvent.changeText(screen.getByLabelText('Telefon'), '+905551112233');
    await fireEvent.press(screen.getByText('Adresi kaydet'));
    await waitFor(() => expect(createAddress).toHaveBeenCalled());
    expect(Location.geocodeAsync).not.toHaveBeenCalled();
    expect(createAddress).toHaveBeenCalledWith(expect.objectContaining({ latitude: 40.9909, longitude: 29.0303, province: 'İstanbul', district: 'Kadıköy' }));
    // The API activates every new address by default; a later one must opt out explicitly.
    expect(createAddress).toHaveBeenCalledWith(expect.objectContaining({ isActive: false }));
    expect(setActiveAddress).not.toHaveBeenCalled();
  });

  it('edits an address in place from ?id=', async () => {
    mockParams.id = 'a1';
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', street: 'Moda Cd.', buildingNumber: '10' })]);
    (updateAddress as jest.Mock).mockResolvedValue(address({}));
    await withLocation(<AddressFormScreen />);
    await waitFor(() => expect(screen.getByLabelText('Adres').props.value).toBe('Moda Cd., 10'));
    await fireEvent.changeText(screen.getByLabelText('Telefon'), '+905559998877');
    await fireEvent.press(screen.getByText('Adresi kaydet'));
    await waitFor(() => expect(updateAddress).toHaveBeenCalled());
    expect(updateAddress).toHaveBeenCalledWith('a1', expect.objectContaining({ phoneE164: '+905559998877', latitude: 40.99, buildingNumber: null }));
    expect(createAddress).not.toHaveBeenCalled();
  });
});

describe('onboarding', () => {
  it('opens the tabs once the first address is saved', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([]);
    (createAddress as jest.Mock).mockResolvedValue(undefined);
    await withLocation(<OnboardingAddress />);
    expect(screen.getByText('Nereye getirelim?')).toBeTruthy();
    await waitFor(() => expect(getAddresses).toHaveBeenCalled());
    await fireEvent.changeText(screen.getByLabelText('Adres'), 'Moda Cd. No: 10');
    await fireEvent.changeText(screen.getByLabelText('Posta kodu'), '34710');
    await fireEvent.changeText(screen.getByLabelText('Telefon'), '+905550000000');
    await fireEvent.press(screen.getByText('Adresi kaydet'));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/(tabs)'));
    expect(createAddress).toHaveBeenCalledWith(expect.objectContaining({ isActive: true }));
  });
});

describe('address sheet', () => {
  it('selects the tapped address and closes', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true }), address({ id: 'a2', street: 'Bağdat Cd.' })]);
    const onClose = jest.fn();
    await withLocation(<AddressSheet visible onClose={onClose} />);
    await fireEvent.press(await screen.findByTestId('sheet-address-a2'));
    expect(onClose).toHaveBeenCalled();
    await waitFor(() => expect(setActiveAddress).toHaveBeenCalledWith('a2'));
    await waitFor(() => expect(getAddresses).toHaveBeenCalledTimes(2));
  });

  it('stays open and tells the person when the address could not be changed', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true }), address({ id: 'a2', street: 'Bağdat Cd.' })]);
    (setActiveAddress as jest.Mock).mockRejectedValue(new Error('offline'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onClose = jest.fn();
    await withLocation(<AddressSheet visible onClose={onClose} />);
    await fireEvent.press(await screen.findByTestId('sheet-address-a2'));
    await waitFor(() => expect(alert).toHaveBeenCalledWith('Bir şeyler ters gitti'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('leads to the new address form', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ id: 'a1', isActive: true })]);
    const onClose = jest.fn();
    await withLocation(<AddressSheet visible onClose={onClose} />);
    await fireEvent.press(await screen.findByText('Yeni adres ekle'));
    expect(onClose).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/addresses/form');
  });
});

describe('start screen', () => {
  const start = () => renderWithProviders(<Index />);

  it('sends a signed-in person without addresses to the onboarding', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([]);
    await start();
    expect(await screen.findByText('redirect:/onboarding/address')).toBeTruthy();
  });

  it('sends a signed-in person with an address to the tabs', async () => {
    (getAddresses as jest.Mock).mockResolvedValue([address({ isActive: true })]);
    await start();
    expect(await screen.findByText('redirect:/(tabs)')).toBeTruthy();
  });

  it('offers a retry when the addresses cannot be loaded', async () => {
    (getAddresses as jest.Mock).mockRejectedValueOnce(new Error('offline')).mockResolvedValue([address({ isActive: true })]);
    await start();
    await fireEvent.press(await screen.findByText('Tekrar dene'));
    expect(await screen.findByText('redirect:/(tabs)')).toBeTruthy();
  });

  it('sends a signed-out person to the sign-in without asking for addresses', async () => {
    mockAuth.status = 'signedOut';
    await start();
    expect(await screen.findByText('redirect:/(auth)/login')).toBeTruthy();
    expect(getAddresses).not.toHaveBeenCalled();
  });
});
