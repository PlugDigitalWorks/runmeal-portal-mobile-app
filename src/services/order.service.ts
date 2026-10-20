import { api } from '@/lib/api';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';
import type { Order } from '@/types/order';

/** GET /orders/customer spans every brand and pages at 10 by default; ask for the API's maximum. */
export async function getMyOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiResponse<Order[] | { data: Order[] }>>('/orders/customer', { params: { limit: 100 } });
  const payload = unwrap(data);
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}
