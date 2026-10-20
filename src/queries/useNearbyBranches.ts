import { useQuery } from '@tanstack/react-query';
import { useLocation } from '@/context/LocationContext';
import { sortForHome } from '@/lib/branch-model';
import { getNearbyBranches } from '@/services/branch.service';
import { qk } from './keys';

/** Branches that deliver to the active address; waits until the address has coordinates. */
export function useNearbyBranches() {
  const { coords } = useLocation();
  return useQuery({
    queryKey: coords ? qk.nearby(coords.latitude, coords.longitude) : ['nearby', 'none'],
    queryFn: () => getNearbyBranches(coords!),
    enabled: !!coords,
    select: (rows) => sortForHome(rows),
  });
}
