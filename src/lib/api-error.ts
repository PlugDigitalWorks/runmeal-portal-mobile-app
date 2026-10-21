import { isAxiosError } from 'axios';

/** The API's own message (runmeal-api always sends `message`), else the fallback copy. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && typeof message[0] === 'string') return message[0];
  }
  return fallback;
}

export type LoadFailure = { kind: 'forbidden' | 'network' | 'server'; status?: number; code?: string };

/**
 * Why a load failed, for screens that must say more than "couldn't connect": 403 means the
 * signed-in account lacks the customer permissions (a manager or admin account), no response
 * means the network, anything else is the server.
 */
export function classifyLoadError(error: unknown): LoadFailure {
  if (!isAxiosError(error) || !error.response) return { kind: 'network' };
  const status = error.response.status;
  return { kind: status === 403 ? 'forbidden' : 'server', status, code: apiErrorCode(error) };
}

/** The API's machine-readable `code` (e.g. PAYMENT_ORDER_TYPE_INVALID), when the error carries one. */
export function apiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const code = (error.response?.data as { code?: unknown } | undefined)?.code;
  return typeof code === 'string' && code ? code : undefined;
}
