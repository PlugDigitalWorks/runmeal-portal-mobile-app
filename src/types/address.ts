export interface Address {
  id: string;
  title?: string | null;
  countryCode: string;
  province: string;
  district: string;
  neighborhood?: string;
  phoneE164?: string | null;
  postalCode: string;
  /** Since brandfe's single-line form, the whole first line (street, house and flat number). */
  street: string;
  buildingNumber?: string | null;
  apartmentNumber?: string | null;
  latitude: number;
  longitude: number;
  isActive: boolean;
}

export interface CreateAddressInput {
  countryCode: string;
  province: string;
  district: string;
  postalCode: string;
  street: string;
  /** Sent as null: the first line lives in `street`, and null clears an older separate value. */
  buildingNumber?: string | null;
  apartmentNumber?: string | null;
  latitude: number;
  longitude: number;
  phoneE164?: string;
  isActive?: boolean;
}
