import { api } from '@/lib/api';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';
import type { StampCard } from '@/types/loyalty';

/** The account-wide Runmeal credit the checkout can spend; 0 when the call has none. */
export async function getCreditBalance(): Promise<number> {
  const { data } = await api.get<ApiResponse<{ balance: number } | null>>('/loyalty/credit/balance');
  return Number(unwrap(data)?.balance ?? 0) || 0;
}

/** The signed-in customer's stamp cards at one brand; empty when the brand has no campaign for them. */
export async function getStampCards(brandId: string): Promise<StampCard[]> {
  const { data } = await api.get<ApiResponse<StampCard[] | null>>(`/loyalty/stamps/me/${encodeURIComponent(brandId)}`);
  return unwrap(data) ?? [];
}
