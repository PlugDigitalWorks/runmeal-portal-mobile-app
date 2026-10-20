import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { addressCoordinates } from '@/lib/address';
import { useAddresses } from '@/queries/useAddresses';
import { qk } from '@/queries/keys';
import { setActiveAddress } from '@/services/address.service';
import type { Address } from '@/types/address';

type Coords = { latitude: number; longitude: number };

type LocationValue = {
  /** The address everything is delivered to and searched around; null until the person has one. */
  activeAddress: Address | null;
  coords: Coords | null;
  isLoading: boolean;
  selectAddress: (id: string) => Promise<void>;
};

const LocationContext = createContext<LocationValue | undefined>(undefined);

/** Keeps the active delivery address (and its coordinates) at hand for every screen that lists nearby places. */
export function LocationProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useAddresses();

  // The API marks one address active; the first one stands in if it ever sends none.
  const activeAddress = data?.find((a) => a.isActive) ?? data?.[0] ?? null;

  const selectAddress = useCallback(
    async (id: string) => {
      await setActiveAddress(id);
      await Promise.all([queryClient.invalidateQueries({ queryKey: qk.addresses }), queryClient.invalidateQueries({ queryKey: qk.nearbyAll })]);
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ activeAddress, coords: activeAddress ? addressCoordinates(activeAddress) : null, isLoading, selectAddress }),
    [activeAddress, isLoading, selectAddress],
  );
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocation(): LocationValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
}
