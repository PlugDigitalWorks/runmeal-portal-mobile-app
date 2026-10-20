import type { Address } from '@/types/address';

const hasPart = (value?: string | null) => !!value && value.trim() !== '' && value.trim() !== '-';

/** brandfe's formatAddressFirstLine: street, then any older separate house and flat number. */
export function addressFirstLine(address: Pick<Address, 'street' | 'buildingNumber' | 'apartmentNumber'>): string {
  const building = hasPart(address.buildingNumber) ? `, ${address.buildingNumber}` : '';
  const apartment = hasPart(address.apartmentNumber) ? ` / ${address.apartmentNumber}` : '';
  return `${address.street}${building}${apartment}`;
}

/** The second line under the first: town and postcode. */
export function addressSecondLine(address: Pick<Address, 'district' | 'province' | 'postalCode'>): string {
  const town = address.district && address.district !== address.province ? `${address.district}, ${address.province}` : address.province;
  return [town, address.postalCode].filter(Boolean).join(' ');
}

/** E.164 as runmeal-api's @IsPhoneNumber expects: +, country code, number; spaces and dashes dropped. */
export function normalizePhone(value: string): string | null {
  const compact = value.replace(/[\s\-().]/g, '');
  return /^\+[1-9]\d{7,14}$/.test(compact) ? compact : null;
}

/** Latitude/longitude when the API sends them, else the PostGIS point ([lng, lat]). */
export function addressCoordinates(address: Address): { latitude: number; longitude: number } | null {
  if (typeof address.latitude === 'number' && typeof address.longitude === 'number') return { latitude: address.latitude, longitude: address.longitude };
  const point = address.locationGeog?.coordinates;
  return point ? { latitude: point[1], longitude: point[0] } : null;
}

/** Short one-line name for the home header and pickers: street and number, then the district. */
export function addressLabel(address: Address): string {
  const first = [address.street, address.buildingNumber].filter(hasPart).join(' ');
  return [first, address.district].filter(Boolean).join(' · ');
}
