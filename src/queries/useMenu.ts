import { useQuery } from '@tanstack/react-query';
import { createLimiter } from '@/lib/semaphore';
import { getBranchMenu } from '@/services/menu.service';
import { qk } from './keys';

/**
 * At most this many menu requests are in flight app-wide. The search screen scans up to twenty menus, and a
 * stale refetch of all of them (foreground, 10 minutes later) must not hit the API as one burst either, so the
 * limit sits in the shared queryFn rather than in whoever happens to enable the queries.
 */
const MENU_CONCURRENCY = 4;
const limitMenuRequests = createLimiter(MENU_CONCURRENCY);

/** One definition of the menu query, kept under `qk.menu` because the home chips and the product sheet read it from the cache. */
export const menuQueryOptions = (branchId: string) => ({
  queryKey: qk.menu(branchId),
  queryFn: () => limitMenuRequests(() => getBranchMenu(branchId)),
  staleTime: 10 * 60_000,
});

/** The branch menu. */
export function useMenu(branchId: string) {
  return useQuery({ ...menuQueryOptions(branchId), enabled: !!branchId });
}
