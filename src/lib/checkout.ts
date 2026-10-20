import type { Href } from 'expo-router';
import type { Branch } from '@/types/branch';
import type { OrderType, PaymentMethod } from '@/types/order';
import { paymentMethodsFor } from './branch-model';

const ORDER_TYPE_SETTING: Record<OrderType, keyof NonNullable<Branch['order_type_settings']>> = {
  DELIVERY: 'delivery',
  SCHEDULED_DELIVERY: 'scheduledDelivery',
  PICKUP: 'pickup',
  SCHEDULED_PICKUP: 'scheduledPickup',
};

/** What the branch's own settings enable, in brandfe's order. Pass `settingsOf(branch)`: the detail call nests them. */
export function orderTypesFor(settings: Pick<Branch, 'order_type_settings'>): OrderType[] {
  const enabled = settings.order_type_settings ?? {};
  return (Object.keys(ORDER_TYPE_SETTING) as OrderType[]).filter((type) => enabled[ORDER_TYPE_SETTING[type]]?.isActive);
}

/**
 * branch-model's rule (a missing setting counts as open) plus brandfe's checkout rule:
 * a scheduled pick-up is paid by card only.
 */
export function paymentMethodsForOrder(settings: Pick<Branch, 'payment_settings'>, orderType: OrderType): PaymentMethod[] {
  const methods = paymentMethodsFor(settings);
  return orderType === 'SCHEDULED_PICKUP' ? methods.filter((method) => method === 'ONLINE_CARD') : methods;
}

export const isScheduled = (type: OrderType): type is 'SCHEDULED_DELIVERY' | 'SCHEDULED_PICKUP' =>
  type === 'SCHEDULED_DELIVERY' || type === 'SCHEDULED_PICKUP';

export const isDelivery = (type: OrderType) => type === 'DELIVERY' || type === 'SCHEDULED_DELIVERY';

/** The API answers "does it deliver here" only through GET /branches/nearby for that point. */
export const deliveryCovered = (branchId: string, nearby: Pick<Branch, 'id'>[]): boolean => nearby.some((b) => b.id === branchId);

export type PaymentCallback = { status: 'success' | 'failure'; paymentId: string | null; orderId: string | null };

/**
 * The app sends the portal web origin with POST /payments/initialize, so the provider returns to
 * `{origin}/payment/callback?status=…`. The payment WebView stops there and the app reads the
 * result instead of loading the portal.
 */
export function parsePaymentCallback(url: string): PaymentCallback | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!parsed.pathname.endsWith('/payment/callback')) return null;
  return {
    status: parsed.searchParams.get('status') === 'success' ? 'success' : 'failure',
    paymentId: parsed.searchParams.get('paymentId'),
    orderId: parsed.searchParams.get('orderId'),
  };
}

/** "Thu, 22 Oct" from the slot API's date; whatever it sends if it is not a plain date. */
export function formatSlotDay(date: string, lang: 'tr' | 'en'): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return date;
  const day = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).format(day);
}

export type OrderTypeChoice = { delivery: boolean; scheduled: boolean };

const typeOfChoice = ({ delivery, scheduled }: OrderTypeChoice): OrderType =>
  delivery ? (scheduled ? 'SCHEDULED_DELIVERY' : 'DELIVERY') : scheduled ? 'SCHEDULED_PICKUP' : 'PICKUP';

/**
 * The order type the two switches (delivery or pick-up, now or scheduled) land on. A choice the branch does
 * not offer falls back to the other timing of the same kind, then to whatever is first.
 */
export function resolveOrderType(types: OrderType[], choice: OrderTypeChoice | null): OrderType | null {
  if (!choice) return types[0] ?? null;
  const exact = typeOfChoice(choice);
  if (types.includes(exact)) return exact;
  return types.find((type) => isDelivery(type) === choice.delivery) ?? types[0] ?? null;
}

/** The order screen after checkout or payment: `placed` shows the "Siparişin alındı" strip and sends back to the tabs. */
export const orderHref = (order: { id: string; branchId: string; brandId: string }): Href => ({ pathname: '/orders/[id]', params: { ...order, placed: '1' } });
