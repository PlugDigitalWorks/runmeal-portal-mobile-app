import { unwrap } from '@/lib/unwrap';

it('unwraps the { status, message, data } envelope', () => {
  expect(unwrap({ status: true, message: 'ok', data: { id: 1 } })).toEqual({ id: 1 });
});

it('returns a bare payload as it is', () => {
  expect(unwrap({ accessToken: 'a' })).toEqual({ accessToken: 'a' });
  expect(unwrap(null)).toBeNull();
});
