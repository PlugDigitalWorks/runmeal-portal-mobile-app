import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { SHOW_MOCKS } from '@/config';
import { useHomeView } from '@/context/HomeViewContext';
import { useLocation } from '@/context/LocationContext';
import { availableCategories, matchedCategory, menuText } from '@/lib/categories';
import { applyHomeView } from '@/lib/home-filters';
import { mockGenerators } from '@/mocks/home-mocks';
import { qk } from '@/queries/keys';
import { useNearbyBranches } from '@/queries/useNearbyBranches';
import type { Branch } from '@/types/branch';
import type { Menu } from '@/types/product';

/** What Keşfet and /restaurants share: the nearby branches, the cuisines present, and the list after sort, filters and cuisine. */
export function useHomeFeed() {
  const queryClient = useQueryClient();
  const { isLoading: locating } = useLocation();
  const { data, isLoading, isError, refetch } = useNearbyBranches();
  const { sort, filters, category } = useHomeView();
  const [refreshing, setRefreshing] = useState(false);

  const branches = useMemo(() => data ?? [], [data]);
  // Menus are only known for restaurants the person already opened; their text sharpens the match.
  const menuTexts = useMemo(() => {
    const texts: Record<string, string> = {};
    for (const b of branches) {
      const menu = queryClient.getQueryData<Menu>(qk.menu(b.id));
      if (menu) texts[b.id] = menuText(menu);
    }
    return texts;
  }, [branches, queryClient]);
  const categories = useMemo(() => availableCategories(branches, menuTexts), [branches, menuTexts]);
  // A change of address can drop the chosen cuisine from the list; fall back to "all" rather than show nothing.
  const active = category && categories.includes(category) ? category : null;
  const visible = useMemo(
    () => applyHomeView(branches, sort, filters, active, menuTexts, new Date(), SHOW_MOCKS ? mockGenerators : undefined),
    [branches, sort, filters, active, menuTexts],
  );
  const cuisineOf = useCallback((branch: Branch) => matchedCategory(branch, menuTexts[branch.id]), [menuTexts]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return {
    branches,
    visible,
    categories,
    active,
    cuisineOf,
    refresh,
    refreshing,
    refetch,
    loading: locating || isLoading,
    // A failed refresh keeps the list already on screen; the error view is only for when there is nothing to show.
    failed: isError && !data,
  };
}
