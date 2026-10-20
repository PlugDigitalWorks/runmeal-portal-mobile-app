import type { AddItemDto } from '@/types/cart';

/** Stub with the final shape; Task 9 replaces it with the real cart mutation. */
export function useAddToCart() {
  return { mutateAsync: async (_input: { dto: AddItemDto; branchId: string; brandId: string }) => undefined, isPending: false };
}
