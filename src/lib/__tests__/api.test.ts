import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { api } from '../api';

type Handler = { fulfilled: (c: InternalAxiosRequestConfig) => Promise<InternalAxiosRequestConfig> };

async function runInterceptors(): Promise<InternalAxiosRequestConfig> {
  const { handlers } = api.interceptors.request as unknown as { handlers: Handler[] };
  let config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  for (const handler of handlers) config = await handler.fulfilled(config);
  return config;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('sends body auth mode and a stable device id on every request', async () => {
  const first = await runInterceptors();
  const second = await runInterceptors();
  expect(api.defaults.headers['x-auth-mode']).toBe('body');
  expect(first.headers['x-device-id']).toEqual(expect.any(String));
  expect(second.headers['x-device-id']).toBe(first.headers['x-device-id']);
});

it('never sends a global x-brand-id', async () => {
  const seen: Record<string, unknown>[] = [];
  api.defaults.adapter = async (config) => {
    seen.push({ ...config.headers });
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
  };
  await api.get('/branches/nearby');
  expect(seen[0]['x-brand-id']).toBeUndefined();
  expect(seen[0]['x-auth-mode']).toBe('body');
  expect(typeof seen[0]['x-device-id']).toBe('string');
});
