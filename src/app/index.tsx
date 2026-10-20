import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

/** Decides where the app opens; the splash stays up until the stored session has been read. */
export default function Index() {
  const { status } = useAuth();
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync();
  }, [status]);

  if (status === 'loading') return null;
  return <Redirect href={status === 'signedIn' ? '/(tabs)' : '/(auth)/login'} />;
}
