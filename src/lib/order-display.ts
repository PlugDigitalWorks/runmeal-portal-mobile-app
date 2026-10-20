import type { OrderItem } from '@/types/order';

/** brandfe's status pill colours: delivered/completed green, cancelled red, everything else the brand tone. */
export function statusTone(status: string): 'success' | 'danger' | 'info' {
  const s = status.toUpperCase();
  if (s === 'DELIVERED' || s === 'COMPLETED') return 'success';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'danger';
  return 'info';
}

/** "PREPARING" → "Preparing" for statuses the copy doesn't name. */
export function humanize(value: string): string {
  const words = value.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function itemQuantity(item: OrderItem): number {
  return Number(item.quantity ?? item.qty ?? 1);
}

/** The order API names line totals differently across versions; brandfe reads them in this order. */
export function itemTotal(item: OrderItem): number {
  const total = item.finalLineTotal ?? item.lineTotal ?? item.totalPrice;
  if (total != null) return Number(total);
  return Number(item.unitPrice ?? item.price ?? 0) * itemQuantity(item);
}

export function itemOptions(item: OrderItem): string {
  return (item.options ?? [])
    .flatMap((group) => group.selections.map((s) => s.optionName))
    .filter(Boolean)
    .join(', ');
}

const dateLocale = (lang: 'tr' | 'en') => (lang === 'tr' ? 'tr-TR' : 'en-GB');

/** "21 Eki 09:05" / "21 Oct, 09:05"; empty for a date the API garbled. `timeZone` is for tests. */
export function formatOrderDate(iso: string, lang: 'tr' | 'en', timeZone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(dateLocale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(date);
}

const MOCK_ETA_MINUTES = 40;

/** Demo arrival time for the "Mock" ETA line: the API has no estimate yet (docs/BACKEND_REQUESTS.md). */
export function mockEta(createdAt: string, timeZone?: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(new Date(date.getTime() + MOCK_ETA_MINUTES * 60_000));
}
