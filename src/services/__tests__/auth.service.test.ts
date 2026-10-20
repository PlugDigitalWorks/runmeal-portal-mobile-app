import { api } from '@/lib/api';
import { requestOtpLogin, verifyOtp } from '@/services/auth.service';

const calls: { url?: string; data?: unknown; headers?: Record<string, unknown> }[] = [];
beforeEach(() => {
  calls.length = 0;
  api.defaults.adapter = async (config) => {
    calls.push({ url: config.url, data: config.data ? JSON.parse(config.data) : undefined, headers: { ...config.headers } });
    const data = config.url === '/auth/verify-otp'
      ? { status: true, message: 'Success', data: { accessToken: 'a', refreshToken: 'r', sid: 's', user: { id: 'u', email: 'e@x.com' } } }
      : { status: true, message: 'Success', data: { message: 'sent' } };
    return { data, status: 200, statusText: 'OK', headers: {}, config };
  };
});

it('asks for an OTP with the user client and the captcha token', async () => {
  await requestOtpLogin('e@x.com', 'cap');
  expect(calls[0]).toMatchObject({ url: '/auth/login', data: { email: 'e@x.com', method: 'otp', client: 'user', recaptchaToken: 'cap' } });
  expect(calls[0].headers?.Authorization).toBeUndefined();
});

it('verifies the code and returns the session', async () => {
  const res = await verifyOtp('e@x.com', '123456');
  expect(calls[0]).toMatchObject({ url: '/auth/verify-otp', data: { email: 'e@x.com', code: '123456', client: 'user' } });
  expect(res.accessToken).toBe('a');
});
