import { AxiosError, create as createAxios, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '@/config';
import type { ApiResponse } from '@/types/api';
import type { SessionTokens } from '@/types/auth';
import { getDeviceId } from './device-id';
import { clearSession, getAccessToken, getTokens, saveTokens, sessionEpoch } from './session';

/** The API scopes refresh sessions per client; the storefront is `user` (brandfe's AUTH_CLIENT). */
export const AUTH_CLIENT = 'user';

/** Requests that must never carry a bearer token or trigger a refresh. */
const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/verify-otp', '/auth/apple/native', '/auth/google/native', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password'];

const baseConfig = {
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', 'x-auth-mode': 'body' },
};

export const api = createAxios(baseConfig);

const isPublicAuth = (url?: string) => PUBLIC_AUTH_PATHS.some((path) => url?.startsWith(path));

api.interceptors.request.use(async (config) => {
  config.headers['x-device-id'] = await getDeviceId();
  const token = getAccessToken();
  if (token && !isPublicAuth(config.url)) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type ExpiredListener = () => void;
const expiredListeners = new Set<ExpiredListener>();

/** Fires when the refresh token is rejected: the user has to sign in again. */
export function onSessionExpired(listener: ExpiredListener): () => void {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
}

/** Ends the local session as expired and tells the app, which shows sign-in with the "session expired" notice. */
export async function expireSession(): Promise<void> {
  await clearSession();
  expiredListeners.forEach((listener) => listener());
}

/** A refresh that finished after the session it belonged to was cleared or replaced: its tokens were dropped. */
export class SessionEndedError extends Error {
  constructor() {
    super('The session ended during the refresh');
    this.name = 'SessionEndedError';
  }
}

let refreshing: Promise<string> | null = null;

/** One refresh for every request that hit a 401 at the same time. */
function refreshAccessToken(): Promise<string> {
  refreshing ??= (async () => {
    const current = getTokens();
    const epoch = sessionEpoch();
    try {
      const { data } = await api.post<ApiResponse<SessionTokens>>('/auth/refresh', {
        client: AUTH_CLIENT,
        refreshToken: current?.refreshToken,
        sid: current?.sid,
      });
      // A sign-out or account deletion while this was in flight must stay signed out.
      if (!(await saveTokens(data.data, epoch))) throw new SessionEndedError();
      return data.data.accessToken;
    } catch (error) {
      // Only a rejected refresh token ends the session; offline or a 5xx keeps it for the next try.
      // A sign-in that happened meanwhile wrote new tokens and must not be wiped.
      const status = error instanceof AxiosError ? error.response?.status : undefined;
      const rejected = status === 400 || status === 401 || status === 403;
      if (rejected && sessionEpoch() === epoch) await expireSession();
      throw error;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  const canRefresh =
    error.response?.status === 401 && config && !config._retried && !isPublicAuth(config.url) && getTokens()?.refreshToken;
  if (!canRefresh) throw error;

  config._retried = true;
  const token = await refreshAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return api.request(config);
});
