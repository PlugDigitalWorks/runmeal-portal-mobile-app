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

/** The API's machine-readable `code` (e.g. PAYMENT_ORDER_TYPE_INVALID), when the error carries one. */
export function apiErrorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const code = (error.response?.data as { code?: unknown } | undefined)?.code;
  return typeof code === 'string' && code ? code : undefined;
}
