import { api } from '@/lib/api';
import { unwrap } from '@/lib/unwrap';
import type { Address, CreateAddressInput } from '@/types/address';
import type { ApiResponse } from '@/types/api';

export async function getAddresses(): Promise<Address[]> {
  const { data } = await api.get<ApiResponse<Address[] | { data: Address[] }>>('/addresses');
  const payload = unwrap(data) as Address[] | { data: Address[] };
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}

/** The API answers only `{ message }`, never the new address; the caller refetches the list. */
export async function createAddress(input: CreateAddressInput): Promise<void> {
  await api.post('/addresses', input);
}

export async function updateAddress(addressId: string, input: Partial<CreateAddressInput>): Promise<void> {
  await api.patch(`/addresses/${addressId}`, input);
}

export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete(`/addresses/${addressId}`);
}

/** Delivery and the nearby feed follow the active address. */
export async function setActiveAddress(addressId: string): Promise<void> {
  await api.patch(`/addresses/${addressId}/set-active`);
}
