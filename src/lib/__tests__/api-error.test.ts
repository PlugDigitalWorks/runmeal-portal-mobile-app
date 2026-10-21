import { AxiosError, type AxiosResponse } from 'axios';
import { apiErrorCode, apiErrorMessage, classifyLoadError } from '../api-error';

const withBody = (data: unknown) =>
  new AxiosError('x', '400', undefined, undefined, { data, status: 400 } as AxiosResponse);

it('shows the API message when there is one', () => {
  expect(apiErrorMessage(withBody({ message: 'Invalid code.' }), 'fallback')).toBe('Invalid code.');
  expect(apiErrorMessage(withBody({ message: ['email must be an email'] }), 'fallback')).toBe('email must be an email');
});

it('falls back for network and unknown errors', () => {
  expect(apiErrorMessage(withBody({}), 'fallback')).toBe('fallback');
  expect(apiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
});

it('reads the machine-readable code of an API error', () => {
  expect(apiErrorCode(withBody({ code: 'PAYMENT_ORDER_TYPE_INVALID', message: 'x' }))).toBe('PAYMENT_ORDER_TYPE_INVALID');
  expect(apiErrorCode(withBody({ message: 'x' }))).toBeUndefined();
  expect(apiErrorCode(new Error('boom'))).toBeUndefined();
});

it('tells a forbidden account, the network and the server apart', () => {
  const withStatus = (status: number, code?: string) =>
    new AxiosError('x', String(status), undefined, undefined, { data: { code }, status } as AxiosResponse);
  expect(classifyLoadError(withStatus(403, 'FORBIDDEN'))).toEqual({ kind: 'forbidden', status: 403, code: 'FORBIDDEN' });
  expect(classifyLoadError(withStatus(500))).toEqual({ kind: 'server', status: 500, code: undefined });
  expect(classifyLoadError(new AxiosError('Network Error', 'ERR_NETWORK'))).toEqual({ kind: 'network' });
  expect(classifyLoadError(new Error('boom'))).toEqual({ kind: 'network' });
});
