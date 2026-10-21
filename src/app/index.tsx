import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { classifyLoadError } from '@/lib/api-error';
import { useAddresses } from '@/queries/useAddresses';
import { ErrorState } from '@/ui/ErrorState';
import { Screen } from '@/ui/Screen';

/**
 * Decides where the app opens: sign-in, the address onboarding, or the tabs. The splash stays up
 * until the stored session is read and, for signed-in people, until their addresses are known.
 */
export default function Index() {
  const { t } = useTranslation();
  const { status, signOut } = useAuth();
  const { data: addresses, isError, error, refetch } = useAddresses();
  const waitingForAddresses = status === 'signedIn' && !addresses && !isError;

  useEffect(() => {
    if (status !== 'loading' && !waitingForAddresses) SplashScreen.hideAsync();
  }, [status, waitingForAddresses]);

  if (status === 'loading' || waitingForAddresses) return null;
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;
  if (isError && !addresses) {
    // Every branch keeps "sign out": when the account itself is the problem, retrying can't help.
    const signOutAction = { title: t('account.signOut'), onPress: () => void signOut() };
    const failure = classifyLoadError(error);
    if (failure.kind === 'forbidden') {
      return (
        <Screen>
          <ErrorState
            icon="account"
            message={t('errors.notCustomerTitle')}
            body={t('errors.notCustomerBody')}
            secondaryAction={signOutAction}
          />
        </Screen>
      );
    }
    return (
      <Screen>
        <ErrorState
          icon={failure.kind === 'network' ? 'network' : 'server'}
          message={failure.kind === 'network' ? t('errors.network') : t('errors.server')}
          body={failure.kind === 'server' ? t('errors.serverBody', { code: failure.code ?? failure.status }) : undefined}
          onRetry={() => void refetch()}
          secondaryAction={signOutAction}
        />
      </Screen>
    );
  }
  return <Redirect href={addresses?.length ? '/(tabs)' : '/onboarding/address'} />;
}
