import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_SORT, NO_FILTERS, type HomeFilters, type HomeSort } from '@/lib/home-filters';
import type { CategoryId } from '@/lib/categories';

type HomeViewValue = {
  sort: HomeSort;
  filters: HomeFilters;
  category: CategoryId | null;
  setSort: (sort: HomeSort) => void;
  setFilters: (filters: HomeFilters) => void;
  setCategory: (category: CategoryId | null) => void;
};

const HomeViewContext = createContext<HomeViewValue | undefined>(undefined);

/** Sort, filters and cuisine live above the tabs so Keşfet and "see all" (/restaurants) show the same view. */
export function HomeViewProvider({ children }: { children: ReactNode }) {
  const [sort, setSort] = useState<HomeSort>(DEFAULT_SORT);
  const [filters, setFilters] = useState<HomeFilters>(NO_FILTERS);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const value = useMemo(() => ({ sort, filters, category, setSort, setFilters, setCategory }), [sort, filters, category]);
  return <HomeViewContext.Provider value={value}>{children}</HomeViewContext.Provider>;
}

export function useHomeView(): HomeViewValue {
  const value = useContext(HomeViewContext);
  if (!value) throw new Error('useHomeView must be used inside HomeViewProvider');
  return value;
}
