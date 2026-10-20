import type { Branch, BusinessHours, DayHours } from '@/types/branch';

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
