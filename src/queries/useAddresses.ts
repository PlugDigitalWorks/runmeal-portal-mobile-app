import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getAddresses } from '@/services/address.service';
import { qk } from './keys';

/** The person's delivery addresses; only fetched once signed in. */
export function useAddresses() {
  const { status } = useAuth();
  return useQuery({ queryKey: qk.addresses, queryFn: getAddresses, enabled: status === 'signedIn' });
}
