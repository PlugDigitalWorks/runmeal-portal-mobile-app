import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import i18n from '@/i18n';
import { onSessionExpired } from '@/lib/api';
import { queryClient } from '@/lib/query-client';
import { clearSession, loadSession, saveSession, saveUser, sessionEpoch } from '@/lib/session';
import { clearUserData } from '@/lib/user-data';
import { logout } from '@/services/auth.service';
import { getProfile } from '@/services/profile.service';
import type { AuthResponse, User } from '@/types/auth';

type Status = 'loading' | 'signedOut' | 'signedIn';

type AuthValue = {
  user: User | null;
  status: Status;
  signIn: (auth: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * After DELETE /profile succeeded: the account is gone, so no logout call. Clears the session,
   * every cached and stored piece of the account's data, and drops the app on sign-in.
   */
  forgetDeletedAccount: () => Promise<void>;
  /** Re-reads the profile, e.g. after the person edits their name. */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const refreshUser = useCallback(async () => {
    const epoch = sessionEpoch();
    const profile = await getProfile();
    if (sessionEpoch() !== epoch) return;
    setUser(profile);
    await saveUser(profile, epoch);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let session: Awaited<ReturnType<typeof loadSession>>;
      try {
        session = await loadSession();
      } catch {
        // An unreadable Keychain must not leave the app on the splash: start signed out on a clean slate.
        await clearSession().catch(() => {});
        if (!cancelled) setStatus('signedOut');
        return;
      }
      if (cancelled) return;
      if (!session.tokens || !session.user) {
        setStatus('signedOut');
        return;
      }
      // Signed in straight from the Keychain, offline included; the profile refresh below
      // goes through the silent token refresh and signs out only if the refresh token is dead.
      setUser(session.user);
      setStatus('signedIn');
      const epoch = sessionEpoch();
      try {
        const profile = await getProfile();
        // A sign-out or account deletion meanwhile must not bring the profile back.
        if (cancelled || sessionEpoch() !== epoch) return;
        setUser(profile);
        await saveUser(profile, epoch);
      } catch {
        // Offline or a transient error: keep the stored session.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        setUser(null);
        setStatus('signedOut');
        queryClient.clear();
        Alert.alert(i18n.t('errors.sessionExpired'));
      }),
    [],
  );

  const signIn = useCallback(async (auth: AuthResponse) => {
    await saveSession(auth);
    setUser(auth.user);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } catch {
      // The local session goes either way.
    }
    await clearSession();
    queryClient.clear();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const forgetDeletedAccount = useCallback(async () => {
    // Session first: a refresh or profile read still in flight now finds a newer epoch and writes nothing back.
    await clearSession();
    await queryClient.cancelQueries();
    queryClient.clear();
    await clearUserData();
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ user, status, signIn, signOut, forgetDeletedAccount, refreshUser }),
    [user, status, signIn, signOut, forgetDeletedAccount, refreshUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
