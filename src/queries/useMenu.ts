import { useQuery } from '@tanstack/react-query';
import { getBranchMenu } from '@/services/menu.service';
import { qk } from './keys';

/** The branch menu; kept under `qk.menu` because the home category chips read it from the cache. */
export function useMenu(branchId: string) {
  return useQuery({ queryKey: qk.menu(branchId), queryFn: () => getBranchMenu(branchId), staleTime: 10 * 60_000, enabled: !!branchId });
}
