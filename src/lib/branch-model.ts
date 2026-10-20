import type { Branch, BranchDetail, BusinessHours, DayHours } from '@/types/branch';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};
const dayOf = (hours: BusinessHours, date: Date): DayHours | undefined => hours[DAYS[date.getDay()]];

/**
 * Device time against the branch's weekly hours. No hours, or an open day
 * without slots (what staging seeds), counts as open; the API's availability
 * check at checkout has the final word.
 */
export function isOpenNow(hours: BusinessHours | undefined, now: Date = new Date()): boolean {
  if (!hours || Object.keys(hours).length === 0) return true;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = dayOf(hours, now);
  const yesterday = dayOf(hours, new Date(now.getTime() - 86_400_000));
  // A slot like 18:00–02:00 started yesterday still covers the small hours.
  const carried = yesterday?.isOpen && yesterday.timeSlots.some((s) => toMinutes(s.close) < toMinutes(s.open) && minutes < toMinutes(s.close));
  if (carried) return true;
  if (!today?.isOpen) return false;
  if (today.timeSlots.length === 0) return true;
  return today.timeSlots.some((s) => {
    const open = toMinutes(s.open);
    const close = toMinutes(s.close);
    return close > open ? minutes >= open && minutes < close : minutes >= open;
  });
}

/** The next opening time later today, if any. */
export function nextOpening(hours: BusinessHours | undefined, now: Date = new Date()): string | null {
  const today = hours ? dayOf(hours, now) : undefined;
  if (!today?.isOpen) return null;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const next = today.timeSlots.map((s) => s.open).filter((open) => toMinutes(open) > minutes).sort((a, b) => toMinutes(a) - toMinutes(b))[0];
  return next ?? null;
}

/** Open places first, then nearest first, so the top of the feed is always somewhere you can order from. */
export function sortForHome(branches: Branch[], now: Date = new Date()): Branch[] {
  return [...branches].sort((a, b) => {
    const openDiff = Number(isOpenNow(b.business_hour, now)) - Number(isOpenNow(a.business_hour, now));
    return openDiff || (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity);
  });
}

export function formatDistance(meters: number | null, lang: 'tr' | 'en'): string {
  if (meters == null || !Number.isFinite(meters)) return '';
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 1 }).format(meters / 1000)} km`;
}

export const bannerOf = (branch: Pick<Branch, 'bannerUrls' | 'logoUrl'>): string | null => branch.bannerUrls?.[0] ?? null;

export type PaymentMethod = 'ONLINE_CARD' | 'CARD_ON_DELIVERY' | 'CASH';
type Settings = Pick<Branch, 'order_type_settings' | 'payment_settings'>;

/**
 * The payment methods a branch accepts. A method the branch has no setting for counts as open (the checkout
 * rule: the API's availability check has the final word); staging sends `[]` where the settings object would be,
 * which reads as "not defined" too.
 */
export function paymentMethodsFor(settings: Pick<Branch, 'payment_settings'>): PaymentMethod[] {
  const payment = settings.payment_settings;
  const online = payment?.onlineMethods as { card?: { isActive?: boolean } } | undefined;
  const offline = payment?.offlineMethods as { cash?: { isActive?: boolean }; cardOnDelivery?: { isActive?: boolean } } | undefined;
  const methods: PaymentMethod[] = [];
  if (online?.card?.isActive ?? true) methods.push('ONLINE_CARD');
  if (offline?.cardOnDelivery?.isActive ?? true) methods.push('CARD_ON_DELIVERY');
  if (offline?.cash?.isActive ?? true) methods.push('CASH');
  return methods;
}

export type Fulfillment = 'delivery' | 'pickup';

/** Delivery and pickup as the branch's own settings enable them (scheduled variants count); none when it sets neither. */
export function fulfillmentOf(settings: Pick<Branch, 'order_type_settings'>): Fulfillment[] {
  const s = settings.order_type_settings;
  const options: Fulfillment[] = [];
  if (s?.delivery?.isActive || s?.scheduledDelivery?.isActive) options.push('delivery');
  if (s?.pickup?.isActive || s?.scheduledPickup?.isActive) options.push('pickup');
  return options;
}

/** The detail call nests the order-type settings under `parameters`; the nearby row has them at the top. */
export const settingsOf = (branch: Branch | BranchDetail): Settings => ({
  order_type_settings: branch.order_type_settings ?? (branch as BranchDetail).parameters?.order_type_settings,
  payment_settings: branch.payment_settings,
});

/** Monday first, the order a weekly timetable is read in. */
export const WEEK_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

/** "11:00–23:00" (several slots joined by a comma); null for a closed day or an open day without slots. */
export function slotsText(day: DayHours | undefined): string | null {
  if (!day?.isOpen || day.timeSlots.length === 0) return null;
  return day.timeSlots.map((s) => `${s.open}–${s.close}`).join(', ');
}

export const todayHours = (hours: BusinessHours | undefined, now: Date = new Date()): string | null => (hours ? slotsText(dayOf(hours, now)) : null);

/** The weekday key of a date in WEEK_DAYS terms, for highlighting today's row. */
export const weekDayOf = (now: Date = new Date()): WeekDay => DAYS[now.getDay()];

/** Apple Maps on iOS, Google Maps elsewhere; the pin when the branch has coordinates, otherwise a text search. */
export function mapsUrl(branch: Pick<Branch, 'name' | 'addressText' | 'locationGeog'>, platform: string): string {
  const point = branch.locationGeog?.coordinates;
  const query = encodeURIComponent(point ? branch.name : branch.addressText ?? branch.name);
  if (platform === 'ios') return point ? `https://maps.apple.com/?ll=${point[1]},${point[0]}&q=${query}` : `https://maps.apple.com/?q=${query}`;
  return point ? `https://www.google.com/maps/search/?api=1&query=${point[1]},${point[0]}` : `https://www.google.com/maps/search/?api=1&query=${query}`;
}
