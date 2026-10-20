/** Branch-scoped endpoints (cart, product, order) read the branch and brand from these headers; nothing else sends them. */
export function branchHeaders(scope: { branchId: string; brandId?: string | null }): Record<string, string> {
  return { 'x-branch-id': scope.branchId, ...(scope.brandId ? { 'x-brand-id': scope.brandId } : {}) };
}
