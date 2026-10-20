import { addressCoordinates, addressLabel, normalizePhone } from '@/lib/address';
import type { Address } from '@/types/address';

const base = { id: 'a', street: 'Moda Cd.', buildingNumber: '10', apartmentNumber: '3', district: 'Kadıköy', province: 'İstanbul', postalCode: '34710', countryCode: 'TR', phoneE164: '+905550000000', isActive: true } as Address;

it('reads coordinates from latitude/longitude, then from locationGeog', () => {
  expect(addressCoordinates({ ...base, latitude: 40.99, longitude: 29.03 })).toEqual({ latitude: 40.99, longitude: 29.03 });
  expect(addressCoordinates({ ...base, latitude: null, longitude: null, locationGeog: { type: 'Point', coordinates: [29.03, 40.99] } } as Address)).toEqual({ latitude: 40.99, longitude: 29.03 });
  expect(addressCoordinates({ ...base, latitude: null, longitude: null } as Address)).toBeNull();
});

it('labels an address by street and district', () => {
  expect(addressLabel(base)).toBe('Moda Cd. 10 · Kadıköy');
});

it('normalizes a phone to E.164 and rejects one without a country code', () => {
  expect(normalizePhone('+90 555 000 00 00')).toBe('+905550000000');
  expect(normalizePhone('0555 000 00 00')).toBeNull();
});
