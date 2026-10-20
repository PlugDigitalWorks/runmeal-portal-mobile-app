import { useQuery } from '@tanstack/react-query';
import { isFinal, ORDER_POLL_MS } from '@/lib/order-status';
import { getMyOrders, getOrder } from '@/services/order.service';
import { qk } from './keys';

export function useOrders() {
  return useQuery({ queryKey: qk.orders, queryFn: getMyOrders });
}

/**
 * One order, re-read every few seconds while it can still change. The interval stops by itself on a
 * final status, and `refetchIntervalInBackground: false` plus the app-focus binding pause it off-screen.
 */
export function useOrder(id: string, scope: { branchId: string; brandId?: string }) {
  return useQuery({
    queryKey: qk.order(id),
    queryFn: () => getOrder(id, scope),
    enabled: !!id && !!scope.branchId,
    refetchInterval: (query) => (query.state.data && isFinal(query.state.data.status) ? false : ORDER_POLL_MS),
    refetchIntervalInBackground: false,
  });
}
