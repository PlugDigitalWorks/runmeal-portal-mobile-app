import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { MENU_PREFETCH_LIMIT } from '@/lib/search';
import { getBranchMenu } from '@/services/menu.service';
import type { Branch } from '@/types/branch';
import type { Menu } from '@/types/product';
import { qk } from './keys';
import { useNearbyBranches } from './useNearbyBranches';

/** At most this many menu requests are in flight: a group opens only once the previous one has settled. */
const GROUP_SIZE = 4;

const EMPTY: Branch[] = [];

/**
 * Everything the on-device search looks through: the nearby branches and the menus of the nearest
 * `MENU_PREFETCH_LIMIT` of them (there is no search endpoint). Menus share `qk.menu` with the restaurant
 * page, so visiting either warms the other; they load in groups so the API never sees a burst.
 */
export function useSearchIndex(): { branches: Branch[]; menus: Record<string, Menu>; loadingMenus: boolean } {
  const { data } = useNearbyBranches();
  const branches = data ?? EMPTY;
  const scanned = useMemo(() => branches.slice(0, MENU_PREFETCH_LIMIT), [branches]);
  const [openGroups, setOpenGroups] = useState(1);

  const results = useQueries({
    queries: scanned.map((branch, i) => ({
      queryKey: qk.menu(branch.id),
      queryFn: () => getBranchMenu(branch.id),
      staleTime: 10 * 60_000,
      enabled: Math.floor(i / GROUP_SIZE) < openGroups,
    })),
  });

  const opened = Math.min(scanned.length, openGroups * GROUP_SIZE);
  const settled = results.slice(0, opened).every((r) => !r.isPending);
  const allOpen = opened >= scanned.length;
  // Opening the next group is a state adjustment made while rendering (React re-renders at once), not an effect.
  if (settled && !allOpen) setOpenGroups((n) => n + 1);

  const stamp = results.map((r) => r.dataUpdatedAt).join(',');
  const menus = useMemo(() => {
    const byBranch: Record<string, Menu> = {};
    scanned.forEach((branch, i) => {
      const menu = results[i]?.data;
      if (menu) byBranch[branch.id] = menu;
    });
    return byBranch;
    // `results` is a new array every render; the update stamps say when its data really changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanned, stamp]);

  return { branches, menus, loadingMenus: !(settled && allOpen) };
}
