import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { MENU_PREFETCH_LIMIT } from '@/lib/search';
import { qk } from '@/queries/keys';
import { useSearchIndex } from '@/queries/useSearchIndex';
import * as menuService from '@/services/menu.service';

const mockBranches = Array.from({ length: 25 }, (_, i) => ({ id: `b${i}`, name: `B${i}`, distanceM: i }));
jest.mock('@/queries/useNearbyBranches', () => ({ useNearbyBranches: () => ({ data: mockBranches, isLoading: false }) }));

let client: QueryClient;
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;

let inFlight = 0;
let peak = 0;
let started: string[] = [];
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 60_000 } } });
  inFlight = 0;
  peak = 0;
  started = [];
  jest.spyOn(menuService, 'getBranchMenu').mockImplementation(async (id) => {
    started.push(id);
    peak = Math.max(peak, ++inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    return { branchId: id, brandId: 'x', currency: 'TRY', currencySymbol: '₺', categories: [] };
  });
});
afterEach(() => client.clear());

it('scans only the nearest menus, never more than four requests at a time', async () => {
  const { result } = await renderHook(() => useSearchIndex(), { wrapper });
  expect(result.current.loadingMenus).toBe(true);
  await waitFor(() => expect(result.current.loadingMenus).toBe(false), { timeout: 3000 });
  expect(started).toHaveLength(MENU_PREFETCH_LIMIT);
  expect(peak).toBeLessThanOrEqual(4);
  expect(Object.keys(result.current.menus)).toHaveLength(MENU_PREFETCH_LIMIT);
});

it('keeps the limit when every cached menu is refetched at once', async () => {
  const { result } = await renderHook(() => useSearchIndex(), { wrapper });
  await waitFor(() => expect(result.current.loadingMenus).toBe(false), { timeout: 3000 });
  started = [];
  peak = 0;
  await act(async () => {
    await client.refetchQueries({ queryKey: qk.menu('b0').slice(0, 1) });
  });
  expect(started).toHaveLength(MENU_PREFETCH_LIMIT);
  expect(peak).toBeGreaterThan(0);
  expect(peak).toBeLessThanOrEqual(4);
});
