import type { OrderStatus } from '@/types/order';

export const ORDER_STEPS: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED'];
/** No push or customer stream in the API yet (docs/BACKEND_REQUESTS.md): the open order screen polls. */
export const ORDER_POLL_MS = 5000;

/** Position on the timeline; -1 for CANCELLED and for a status the app does not know. */
export const stepIndex = (status: string): number => ORDER_STEPS.indexOf(status.toUpperCase() as OrderStatus);
export const isFinal = (status: string): boolean => ['DELIVERED', 'CANCELLED'].includes(status.toUpperCase());
export const isActiveOrder = (status: string): boolean => !isFinal(status);
