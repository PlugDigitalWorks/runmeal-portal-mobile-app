import { api } from '@/lib/api';
import { branchHeaders } from '@/lib/branch-headers';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';
import type { AddItemDto, Cart } from '@/types/cart';
import type { OrderType } from '@/types/order';

/** Which branch (and brand) a cart call acts on; the backend reads it from the headers. */
export type CartScope = { branchId: string; brandId?: string | null };

/** `id` and `cartId` both occur in API responses; brandfe reads either. */
export const cartIdOf = (cart: Cart | null | undefined): string | null => cart?.id ?? cart?.cartId ?? null;

/**
 * One cart at a time across the marketplace: the newest active row, read in full through GET /carts/:id.
 * GET /carts lists bare rows without items or totals, hence the second call.
 */
export async function getCurrentCart(): Promise<Cart | null> {
  const { data } = await api.get<ApiResponse<Cart[] | null>>('/carts');
  const rows = (unwrap(data) ?? []).filter((cart) => cart.isActive !== false && cartIdOf(cart));
  rows.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  const row = rows[0];
  if (!row) return null;
  const full = await api.get<ApiResponse<Cart>>(`/carts/${cartIdOf(row)}`, { headers: branchHeaders({ branchId: row.branchId, brandId: row.brandId }) });
  return unwrap(full.data);
}

export async function addCartItem(dto: AddItemDto, scope: CartScope): Promise<Cart> {
  const { data } = await api.post<ApiResponse<Cart>>('/carts/items', dto, { headers: branchHeaders(scope) });
  return unwrap(data);
}

/** The API may answer only `{ message }`; the caller re-reads the cart. */
export async function setCartItemQty(itemId: string, qty: number, scope: CartScope): Promise<void> {
  await api.patch('/carts/items/qty', { itemId, qty }, { headers: branchHeaders(scope) });
}

export async function removeCartItem(itemId: string, scope: CartScope): Promise<void> {
  await api.delete(`/carts/items/${encodeURIComponent(itemId)}`, { headers: branchHeaders(scope) });
}

export async function clearCart(cartId: string, scope: CartScope): Promise<void> {
  await api.delete('/carts', { data: { cartId }, headers: branchHeaders(scope) });
}

/** Applies a Runmeal coupon; the answer is the whole re-priced cart. Same body as the portal web. */
export async function applyPromotion(cartId: string, input: { promotionCode: string; orderType: OrderType }, scope: CartScope): Promise<Cart> {
  const { data } = await api.post<ApiResponse<Cart>>(
    `/carts/${encodeURIComponent(cartId)}/promotions/apply`,
    { type: 'INTERNAL', promotionCode: input.promotionCode, orderType: input.orderType },
    { headers: branchHeaders(scope) },
  );
  return unwrap(data);
}

/** Removes one coupon, or every internal promotion when no code is given (the portal web's contract). */
export async function removePromotion(cartId: string, scope: CartScope, promotionCode?: string): Promise<Cart> {
  const { data } = await api.post<ApiResponse<Cart>>(
    `/carts/${encodeURIComponent(cartId)}/promotions/remove`,
    { type: 'INTERNAL', ...(promotionCode ? { promotionCode } : {}) },
    { headers: branchHeaders(scope) },
  );
  return unwrap(data);
}
