import { isAxiosError } from 'axios';
import type { User } from '@/types/auth';
import { apiErrorCode } from './api-error';

/** Only a signed-in customer's own account can be closed from the app; guests and staff accounts cannot. */
export function canDeleteAccount(user: User | null): boolean {
  return !!user && user.role?.toLowerCase() === 'customer' && !user.isGuest;
}

/** The API codes for a delete it refused; each has its own message under `deleteAccount.errors`. */
const KNOWN_CODES = [
  'USER_ACCOUNT_DELETE_BALANCE_REMAINING',
  'USER_ACCOUNT_DELETE_ACTIVE_OPERATION',
  'USER_ACCOUNT_DELETE_PROVIDER_UNAVAILABLE',
] as const;

export type DeleteFailure =
  | { kind: 'refused'; code: (typeof KNOWN_CODES)[number] }
  /** The session is no longer valid: the app's session-expired flow takes over. */
  | { kind: 'unauthorized' }
  | { kind: 'forbidden' }
  /** The API has no DELETE /profile route. */
  | { kind: 'unavailable' }
  /** No answer (offline, timeout): the account may or may not be deleted. */
  | { kind: 'unknown' }
  | { kind: 'failed' };

export function classifyDeleteError(error: unknown): DeleteFailure {
  if (!isAxiosError(error)) return { kind: 'failed' };
  if (!error.response) return { kind: 'unknown' };
  const code = apiErrorCode(error);
  const known = KNOWN_CODES.find((c) => c === code);
  if (known) return { kind: 'refused', code: known };
  const status = error.response.status;
  if (status === 401) return { kind: 'unauthorized' };
  if (status === 403) return { kind: 'forbidden' };
  if (status === 404 || status === 405) return { kind: 'unavailable' };
  return { kind: 'failed' };
}
