import { useQuery } from '@tanstack/react-query';
import { getCreditBalance } from '@/services/loyalty.service';
import { qk } from './keys';

/** The account-wide Runmeal credit; the account screens show it as lira. */
export function useCreditBalance() {
  return useQuery({ queryKey: qk.credit, queryFn: getCreditBalance });
}
