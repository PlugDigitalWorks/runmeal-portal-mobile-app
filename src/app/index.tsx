import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAddresses } from '@/queries/useAddresses';
import { ErrorState } from '@/ui/ErrorState';
import { Screen } from '@/ui/Screen';

/**
 * Decides where the app opens: sign-in, the address onboarding, or the tabs. The splash stays up
 * until the stored session is read and, for signed-in people, until their addresses are known.
 */
export default function Index() {
  const { status } = useAuth();
  const { data: addresses, isError, refetch } = useAddresses();
  const waitingForAddresses = status === 'signedIn' && !addresses && !isError;

  useEffect(() => {
    if (status !== 'loading' && !waitingForAddresses) SplashScreen.hideAsync();
  }, [status, waitingForAddresses]);

  if (status === 'loading' || waitingForAddresses) return null;
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;
  if (isError && !addresses) {
    return (
      <Screen>
        <ErrorState onRetry={() => void refetch()} />
      </Screen>
    );
  }
  return <Redirect href={addresses?.length ? '/(tabs)' : '/onboarding/address'} />;
}
