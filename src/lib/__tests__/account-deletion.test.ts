import { canDeleteAccount, classifyDeleteError } from '../account-deletion';

const user = { id: 'u', email: 'a@b.co', firstName: 'A', lastName: 'B' };
const axiosError = (status?: number, code?: string) =>
  Object.assign(new Error('x'), { isAxiosError: true, response: status ? { status, data: { code } } : undefined });

it('lets only a signed-in, non-guest customer delete the account', () => {
  expect(canDeleteAccount({ ...user, role: 'customer' })).toBe(true);
  expect(canDeleteAccount({ ...user, role: 'CUSTOMER' })).toBe(true);
  expect(canDeleteAccount({ ...user, role: 'customer', isGuest: true })).toBe(false);
  expect(canDeleteAccount({ ...user, role: 'manager' })).toBe(false);
  expect(canDeleteAccount(null)).toBe(false);
});

it('reads the refusal from the envelope code before the status', () => {
  expect(classifyDeleteError(axiosError(409, 'USER_ACCOUNT_DELETE_BALANCE_REMAINING'))).toEqual({ kind: 'refused', code: 'USER_ACCOUNT_DELETE_BALANCE_REMAINING' });
  expect(classifyDeleteError(axiosError(503, 'USER_ACCOUNT_DELETE_PROVIDER_UNAVAILABLE'))).toEqual({ kind: 'refused', code: 'USER_ACCOUNT_DELETE_PROVIDER_UNAVAILABLE' });
  expect(classifyDeleteError(axiosError(409, 'SOMETHING_ELSE'))).toEqual({ kind: 'failed' });
  expect(classifyDeleteError(axiosError(401))).toEqual({ kind: 'unauthorized' });
  expect(classifyDeleteError(axiosError(403))).toEqual({ kind: 'forbidden' });
  expect(classifyDeleteError(axiosError(404))).toEqual({ kind: 'unavailable' });
  expect(classifyDeleteError(axiosError())).toEqual({ kind: 'unknown' });
  expect(classifyDeleteError(new Error('boom'))).toEqual({ kind: 'failed' });
});
