export interface DayHours {
  isOpen: boolean;
  timeSlots: { open: string; close: string }[];
}

export type BusinessHours = Partial<
  Record<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday', DayHours>
>;

/** A row of GET /branches/nearby (no brandId: read it from BranchDetail or the menu). */
export interface Branch {
  id: string;
  name: string;
  slug: string;
  brandSlug?: string | null;
  addressText: string | null;
  logoUrl: string | null;
  bannerUrls: string[] | null;
  locationGeog: { type: 'Point'; coordinates: [number, number] } | null;
  currency: string;
  currencySymbol: string;
  distanceM: number | null;
  deliveryRadiusM?: number | null;
  minBasketPrice?: number | null;
  brandId?: string;
  business_hour?: BusinessHours;
  order_type_settings?: {
    pickup?: { isActive: boolean };
    delivery?: { isActive: boolean };
    scheduledPickup?: { isActive: boolean };
    scheduledDelivery?: { isActive: boolean };
  };
  payment_settings?: {
    isActive?: boolean;
    onlineMethods?: { card?: { isActive: boolean; provider?: string } } | unknown[];
    offlineMethods?: { cash?: { isActive: boolean }; cardOnDelivery?: { isActive: boolean } } | unknown[];
  };
}

/** GET /branches/:id */
export interface BranchDetail extends Omit<Branch, 'distanceM'> {
  brandId: string;
  isActive: boolean;
  isOpen: boolean;
  timeZone?: string;
  district?: string | null;
  province?: string | null;
  parameters?: { business_hours?: BusinessHours; order_type_settings?: Branch['order_type_settings'] } | null;
}
