import { api } from '@/lib/api';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';

/** The account-wide Runmeal credit the checkout can spend; 0 when the call has none. */
export async function getCreditBalance(): Promise<number> {
  const { data } = await api.get<ApiResponse<{ balance: number } | null>>('/loyalty/credit/balance');
  return Number(unwrap(data)?.balance ?? 0) || 0;
}
