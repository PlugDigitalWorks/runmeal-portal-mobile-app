const NEARBY = 'nearby';

/** Every query key in one place so invalidation can never drift from the hooks. */
export const qk = {
  addresses: ['addresses'] as const,
  profile: ['profile'] as const,
  /** Prefix of every nearby-branches query: use it to read or invalidate all of them. */
  nearbyAll: [NEARBY] as const,
  nearby: (lat: number, lng: number) => [NEARBY, lat.toFixed(4), lng.toFixed(4)] as const,
  branch: (id: string) => ['branch', id] as const,
  menu: (branchId: string) => ['menu', branchId] as const,
  product: (id: string, branchId: string) => ['product', id, branchId] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['order', id] as const,
  availability: (branchId: string) => ['availability', branchId] as const,
  slots: (branchId: string, type: string) => ['slots', branchId, type] as const,
  credit: ['credit'] as const,
  stamps: (brandId: string) => ['stamps', brandId] as const,
};
