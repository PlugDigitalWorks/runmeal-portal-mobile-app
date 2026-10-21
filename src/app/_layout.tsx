import '@/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SHOW_MOCKS } from '@/config';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { HomeViewProvider } from '@/context/HomeViewContext';
import { LocationProvider } from '@/context/LocationContext';
import { loadLanguage } from '@/lib/language';
import { bindAppFocus, queryClient } from '@/lib/query-client';
import { colors } from '@/theme';
import { MockTag } from '@/ui/MockTag';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    loadLanguage().finally(() => setReady(true));
    return bindAppFocus();
  }, []);
  if (!ready) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LocationProvider>
              <HomeViewProvider>
                <StatusBar style="dark" />
                <RootStack />
              </HomeViewProvider>
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * The navigator, mounted once the stored session is read so a cold-start deep link is not redirected
 * before the app knows who is signed in. `index` stays open to both states: it picks where the app opens.
 */
function RootStack() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const pathname = usePathname();

  // `index` keeps the splash up while it waits for the addresses; any other first screen (a deep link)
  // drops it here, or nothing would.
  useEffect(() => {
    if (status !== 'loading' && pathname !== '/') SplashScreen.hideAsync();
  }, [status, pathname]);

  if (status === 'loading') return null;
  return (
    <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground, contentStyle: { backgroundColor: colors.background }, headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Protected guard={status === 'signedOut'} redirectTo="/">
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      {/* Sign-out and an expired session drop every screen below, from any depth of the stack, onto sign-in. */}
      <Stack.Protected guard={status === 'signedIn'} redirectTo="/(auth)/login">
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/address" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="addresses/index" options={{ title: t('addresses.title') }} />
        <Stack.Screen name="addresses/form" options={({ route }) => ({ title: (route.params as { id?: string } | undefined)?.id ? t('addresses.editTitle') : t('addresses.newTitle') })} />
        <Stack.Screen name="cart" options={{ title: t('cart.title') }} />
        <Stack.Screen name="checkout" options={{ title: t('checkout.title') }} />
        <Stack.Screen name="payment" options={{ presentation: 'fullScreenModal', headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="restaurants" options={{ title: t('restaurants.title') }} />
        <Stack.Screen name="search" options={{ headerShown: false }} />
        <Stack.Screen
          name="deals"
          options={{ presentation: 'modal', headerShown: false, contentStyle: { backgroundColor: colors.background } }}
        />
        <Stack.Screen name="account" options={{ title: t('account.title') }} />
        <Stack.Screen name="account/profile" options={{ title: t('account.profile.title'), headerRight: SHOW_MOCKS ? () => <MockTag /> : undefined }} />
        <Stack.Screen name="account/cards" options={{ title: t('account.cards.title') }} />
        <Stack.Screen name="account/coupons" options={{ title: SHOW_MOCKS ? `${t('account.coupons.title')} (${t('common.mock')})` : t('account.coupons.title') }} />
        <Stack.Screen name="account/email" options={{ title: t('account.email.title') }} />
        <Stack.Screen name="account/notifications" options={{ title: t('account.notifications.title') }} />
        <Stack.Screen name="account/feedback" options={{ title: t('account.feedback.title') }} />
        <Stack.Screen name="account/security" options={{ title: t('account.security.title') }} />
        <Stack.Screen name="account/more" options={{ title: t('account.more.title') }} />
        <Stack.Screen name="orders/[id]" options={{ title: t('orders.detailTitle') }} />
        <Stack.Screen name="rewards" options={{ title: t('rewards.title') }} />
        <Stack.Screen name="legal/[page]" options={({ route }) => ({ title: (route.params as { page?: string } | undefined)?.page === 'terms' ? t('account.more.terms') : t('account.more.privacy') })} />
        <Stack.Screen name="delete-account" options={{ title: t('deleteAccount.title') }} />
        <Stack.Screen name="campaigns/[id]" options={{ title: t('campaigns.title') }} />
        <Stack.Screen name="restaurant/[branchId]" options={{ headerTransparent: true, headerTitle: '', headerBackButtonDisplayMode: 'minimal' }} />
        <Stack.Screen
          name="product/[id]"
          options={{ presentation: 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, headerShown: false, contentStyle: { backgroundColor: colors.card } }}
        />
      </Stack.Protected>
    </Stack>
  );
}
