import { PORTAL_WEB_ORIGIN } from '@/config';
import { api } from '@/lib/api';
import { branchHeaders } from '@/lib/branch-headers';
import { unwrap } from '@/lib/unwrap';
import type { ApiResponse } from '@/types/api';
import type { InitializePaymentInput, PaymentInitializationResponse, PaymentRecord } from '@/types/order';

const PAID = ['SUCCESS', 'SUCCEEDED', 'PAID', 'COMPLETED'];
const FAILED = ['FAILED', 'FAILURE', 'CANCELLED', 'CANCELED', 'REFUNDED'];
const SETTLED = [...PAID, ...FAILED];

/**
 * Starts a payment for the cart. The API builds the provider's return URL from the request Origin,
 * so the app sends the portal web origin; the payment screen intercepts that callback.
 */
export async function initializePayment(input: InitializePaymentInput & { brandId: string }): Promise<PaymentInitializationResponse> {
  const { data } = await api.post<ApiResponse<PaymentInitializationResponse>>(
    '/payments/initialize',
    {
      cartId: input.cartId,
      paymentMethod: input.paymentMethod,
      orderType: input.orderType,
      ...(input.scheduledFor ? { scheduledFor: input.scheduledFor } : {}),
      creditUsedAmount: input.creditUsedAmount ?? 0,
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    },
    { headers: { ...branchHeaders({ branchId: input.branchId, brandId: input.brandId }), Origin: PORTAL_WEB_ORIGIN, Referer: `${PORTAL_WEB_ORIGIN}/` } },
  );
  return unwrap(data);
}

export async function getPayment(paymentId: string): Promise<PaymentRecord> {
  const { data } = await api.get<ApiResponse<PaymentRecord>>(`/payments/${encodeURIComponent(paymentId)}`);
  return unwrap(data);
}

/** portalfe's callback page: up to five reads, 1.5 s apart, until the provider's webhook lands. */
export async function waitForPayment(paymentId: string, { tries = 5, delayMs = 1500 } = {}): Promise<PaymentRecord> {
  let last = await getPayment(paymentId);
  for (let i = 1; i < tries && !SETTLED.includes(String(last.status).toUpperCase()); i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    last = await getPayment(paymentId);
  }
  return last;
}

export const isPaid = (payment: PaymentRecord): boolean => PAID.includes(String(payment.status).toUpperCase());

/** The provider has given its final answer and it is a no; anything else may still turn into a yes. */
export const isFailedPayment = (payment: PaymentRecord): boolean => FAILED.includes(String(payment.status).toUpperCase());
