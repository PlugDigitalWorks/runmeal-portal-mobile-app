import { api } from '@/lib/api';
import { branchHeaders } from '@/lib/branch-headers';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';
import type { Order, OrderDetails } from '@/types/order';

/** GET /orders/customer spans every brand and pages at 10 by default; ask for the API's maximum. */
export async function getMyOrders(): Promise<Order[]> {
  const { data } = await api.get<ApiResponse<Order[] | { data: Order[] }>>('/orders/customer', { params: { limit: 100 } });
  const payload = unwrap(data);
  return Array.isArray(payload) ? payload : (payload?.data ?? []);
}

/** GET /orders/:id is branch-scoped: the branch (and brand) headers say whose order book to look in. */
export async function getOrder(orderId: string, scope: { branchId: string; brandId?: string | null }): Promise<OrderDetails> {
  const { data } = await api.get<ApiResponse<OrderDetails>>(`/orders/${encodeURIComponent(orderId)}`, { headers: branchHeaders(scope) });
  return unwrap(data);
}
