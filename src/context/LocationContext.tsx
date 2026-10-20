import type { ReactNode } from 'react';

/** Skeleton so the root layout is final; the real provider (active address, coordinates) replaces it. */
export function LocationProvider({ children }: { children: ReactNode }) {
  return children;
}

export function useLocation(): { activeAddress: unknown; coords: unknown; isLoading: boolean; selectAddress: (address: unknown) => Promise<void> } {
  return { activeAddress: null, coords: null, isLoading: false, selectAddress: async () => {} };
}
