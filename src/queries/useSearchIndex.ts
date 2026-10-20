import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { MENU_PREFETCH_LIMIT } from '@/lib/search';
import type { Branch } from '@/types/branch';
import type { Menu } from '@/types/product';
import { menuQueryOptions } from './useMenu';
import { useNearbyBranches } from './useNearbyBranches';

const EMPTY: Branch[] = [];

/**
 * Everything the on-device search looks through: the nearby branches and the menus of the nearest
 * `MENU_PREFETCH_LIMIT` of them (there is no search endpoint). Menus use the same query as the restaurant
 * page, so visiting either warms the other; the shared request limiter keeps the API from seeing a burst.
 * `loadingMenus` is also true while the nearby list itself is still loading.
 */
export function useSearchIndex(): { branches: Branch[]; menus: Record<string, Menu>; loadingMenus: boolean } {
  const { data, isLoading } = useNearbyBranches();
  const branches = data ?? EMPTY;
  const scanned = useMemo(() => branches.slice(0, MENU_PREFETCH_LIMIT), [branches]);

  const combine = useCallback(
    (results: { data?: Menu; isPending: boolean }[]) => {
      const menus: Record<string, Menu> = {};
      scanned.forEach((branch, i) => {
        const menu = results[i]?.data;
        if (menu) menus[branch.id] = menu;
      });
      return { menus, loadingMenus: results.some((r) => r.isPending) };
    },
    [scanned],
  );
  const { menus, loadingMenus } = useQueries({ queries: scanned.map((branch) => menuQueryOptions(branch.id)), combine });

  return { branches, menus, loadingMenus: isLoading || loadingMenus };
}
