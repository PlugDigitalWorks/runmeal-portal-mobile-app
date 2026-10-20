import { api } from '@/lib/api';
import { unwrap } from '@/lib/unwrap';
import type { Address, CreateAddressInput } from '@/types/address';
import type { ApiResponse } from '@/types/api';

export async function getAddresses(): Promise<Address[]> {
  const { data } = await api.get<ApiResponse<Address[] | { data: Address[] }>>('/addresses');
  const payload = unwrap(data) as Address[] | { data: Address[] };
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}

export async function createAddress(input: CreateAddressInput): Promise<Address> {
  const { data } = await api.post<ApiResponse<Address>>('/addresses', input);
  return unwrap(data);
}

export async function updateAddress(addressId: string, input: Partial<CreateAddressInput>): Promise<Address> {
  const { data } = await api.patch<ApiResponse<Address>>(`/addresses/${addressId}`, input);
  return unwrap(data);
}

export async function deleteAddress(addressId: string): Promise<void> {
  await api.delete(`/addresses/${addressId}`);
}

/** Delivery and the nearby feed follow the active address. */
export async function setActiveAddress(addressId: string): Promise<void> {
  await api.patch(`/addresses/${addressId}/set-active`);
}
