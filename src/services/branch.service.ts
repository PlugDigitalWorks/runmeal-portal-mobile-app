import { api } from '@/lib/api';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';
import type { Branch, BranchDetail } from '@/types/branch';
import type { BranchAvailability, FulfillmentSlotsResponse, ScheduledOrderType } from '@/types/order';

/** Branches that deliver to the point, nearest data (`distanceM`) included; the API does the radius check. */
export async function getNearbyBranches(coords: { latitude: number; longitude: number }): Promise<Branch[]> {
  const { data } = await api.get<ApiResponse<Branch[]>>('/branches/nearby', { params: { lat: coords.latitude, lng: coords.longitude } });
  return unwrap(data) ?? [];
}

export async function getBranch(id: string): Promise<BranchDetail> {
  const { data } = await api.get<ApiResponse<BranchDetail>>(`/branches/${encodeURIComponent(id)}`);
  return unwrap(data);
}

export async function getBranchAvailability(id: string): Promise<BranchAvailability> {
  const { data } = await api.get<ApiResponse<BranchAvailability>>(`/branches/${encodeURIComponent(id)}/availability`);
  return unwrap(data);
}

export async function getFulfillmentSlots(id: string, orderType: ScheduledOrderType): Promise<FulfillmentSlotsResponse> {
  const { data } = await api.get<ApiResponse<FulfillmentSlotsResponse>>(`/branches/${encodeURIComponent(id)}/fulfillment-slots`, {
    params: { orderType },
  });
  return unwrap(data);
}
