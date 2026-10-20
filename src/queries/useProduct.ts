import { useQuery } from '@tanstack/react-query';
import { getProduct } from '@/services/menu.service';
import { qk } from './keys';

/** One product with its option groups; the branch is part of the key because prices and options are branch-scoped. */
export function useProduct(id: string, branchId: string, brandId?: string | null) {
  return useQuery({ queryKey: qk.product(id, branchId), queryFn: () => getProduct(id, { branchId, brandId }), enabled: !!id && !!branchId });
}
