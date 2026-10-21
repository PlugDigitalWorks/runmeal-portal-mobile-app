import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse, SessionTokens, User } from '@/types/auth';

/** Tokens live in the Keychain / Keystore; the profile is not secret and stays in AsyncStorage. */
const TOKENS_KEY = 'rm_session';
const USER_KEY = 'rm_user';

let tokens: SessionTokens | null = null;
// Bumped whenever the session is replaced or cleared, so work that started under an older session
// (a refresh, a profile read) cannot write that session back after a sign-out or an account deletion.
let epoch = 0;

export function sessionEpoch(): number {
  return epoch;
}

/** Read synchronously by the axios interceptor. */
export function getAccessToken(): string | null {
  return tokens?.accessToken ?? null;
}

export function getTokens(): SessionTokens | null {
  return tokens;
}

export async function loadSession(): Promise<{ tokens: SessionTokens | null; user: User | null }> {
  const [rawTokens, rawUser] = await Promise.all([SecureStore.getItemAsync(TOKENS_KEY), AsyncStorage.getItem(USER_KEY)]);
  try {
    tokens = rawTokens ? (JSON.parse(rawTokens) as SessionTokens) : null;
  } catch {
    tokens = null;
  }
  let user: User | null = null;
  try {
    user = rawUser ? (JSON.parse(rawUser) as User) : null;
  } catch {
    user = null;
  }
  if (tokens && !user) {
    // A half-written session would send a bearer token while the UI shows signed out.
    await clearSession();
    return { tokens: null, user: null };
  }
  return { tokens, user: tokens ? user : null };
}

export async function saveSession({ user, ...next }: AuthResponse): Promise<void> {
  epoch++;
  tokens = { accessToken: next.accessToken, refreshToken: next.refreshToken, sid: next.sid };
  await Promise.all([
    SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens)),
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  ]);
}

/**
 * A refresh may or may not rotate the refresh token and sid; keep what it does not send.
 * With `since`, writes only if the session is still the one from that epoch; returns whether it wrote.
 */
export async function saveTokens(next: SessionTokens, since?: number): Promise<boolean> {
  if (since !== undefined && since !== epoch) return false;
  tokens = {
    accessToken: next.accessToken,
    refreshToken: next.refreshToken ?? tokens?.refreshToken,
    sid: next.sid ?? tokens?.sid,
  };
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
  return true;
}

/** With `since`, writes only if the session is still the one from that epoch. */
export async function saveUser(user: User, since?: number): Promise<void> {
  if (since !== undefined && since !== epoch) return;
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  epoch++;
  tokens = null;
  await Promise.all([SecureStore.deleteItemAsync(TOKENS_KEY), AsyncStorage.removeItem(USER_KEY)]);
}
