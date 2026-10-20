import { api } from '@/lib/api';
import { branchHeaders } from '@/lib/branch-headers';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';
import type { Menu, Product } from '@/types/product';

export async function getBranchMenu(branchId: string): Promise<Menu> {
  const { data } = await api.get<ApiResponse<Menu>>(`/branches/${encodeURIComponent(branchId)}/menu`);
  return unwrap(data);
}

/** Option groups only come with the single-product call, which is branch-scoped through the headers. */
export async function getProduct(productId: string, scope: { branchId: string; brandId?: string | null }): Promise<Product> {
  const { data } = await api.get<ApiResponse<Product>>(`/products/${encodeURIComponent(productId)}`, { headers: branchHeaders(scope) });
  return unwrap(data);
}
