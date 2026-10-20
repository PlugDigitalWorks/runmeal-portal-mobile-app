import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { MENU_PREFETCH_LIMIT } from '@/lib/search';
import { useSearchIndex } from '@/queries/useSearchIndex';
import * as menuService from '@/services/menu.service';

const mockBranches = Array.from({ length: 25 }, (_, i) => ({ id: `b${i}`, name: `B${i}`, distanceM: i }));
jest.mock('@/queries/useNearbyBranches', () => ({ useNearbyBranches: () => ({ data: mockBranches }) }));

const wrapper = ({ children }: { children: ReactNode }) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

it('scans only the nearest menus, never more than four requests at a time', async () => {
  let inFlight = 0;
  let peak = 0;
  const started: string[] = [];
  jest.spyOn(menuService, 'getBranchMenu').mockImplementation(async (id) => {
    started.push(id);
    peak = Math.max(peak, ++inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    return { branchId: id, brandId: 'x', currency: 'TRY', currencySymbol: '₺', categories: [] };
  });
  const { result } = await renderHook(() => useSearchIndex(), { wrapper });
  expect(result.current.loadingMenus).toBe(true);
  await waitFor(() => expect(result.current.loadingMenus).toBe(false), { timeout: 3000 });
  await act(async () => {});
  expect(started).toHaveLength(MENU_PREFETCH_LIMIT);
  expect(peak).toBeLessThanOrEqual(4);
  expect(Object.keys(result.current.menus)).toHaveLength(MENU_PREFETCH_LIMIT);
});
