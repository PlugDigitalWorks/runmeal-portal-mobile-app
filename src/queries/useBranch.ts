import { useQuery } from '@tanstack/react-query';
import { getBranch } from '@/services/branch.service';
import { qk } from './keys';

export function useBranch(branchId: string) {
  return useQuery({ queryKey: qk.branch(branchId), queryFn: () => getBranch(branchId), enabled: !!branchId });
}
