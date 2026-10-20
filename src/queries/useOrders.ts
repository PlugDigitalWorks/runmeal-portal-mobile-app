import { useQuery } from '@tanstack/react-query';
import { useIsFocused } from 'expo-router';
import { isFinal, ORDER_POLL_MS } from '@/lib/order-status';
import { getMyOrders, getOrder } from '@/services/order.service';
import { qk } from './keys';

export function useOrders() {
  return useQuery({ queryKey: qk.orders, queryFn: getMyOrders });
}

/**
 * One order, re-read every few seconds while it can still change. The interval stops by itself on a
 * final status, and while the screen is not the focused one; `refetchIntervalInBackground: false` plus the
 * app-focus binding pause it when the app is backgrounded. A failed first load (404, 403) does not poll
 * forever: the screen offers a retry instead.
 */
export function useOrder(id: string, scope: { branchId: string; brandId?: string }) {
  const focused = useIsFocused();
  return useQuery({
    queryKey: qk.order(id),
    queryFn: () => getOrder(id, scope),
    enabled: !!id && !!scope.branchId,
    refetchInterval: (query) => {
      if (!focused) return false;
      if (query.state.data) return isFinal(query.state.data.status) ? false : ORDER_POLL_MS;
      return query.state.status === 'error' ? false : ORDER_POLL_MS;
    },
    refetchIntervalInBackground: false,
  });
}
