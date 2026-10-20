import '@/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SHOW_MOCKS } from '@/config';
import { AuthProvider } from '@/context/AuthContext';
import { HomeViewProvider } from '@/context/HomeViewContext';
import { LocationProvider } from '@/context/LocationContext';
import { loadLanguage } from '@/lib/language';
import { bindAppFocus, queryClient } from '@/lib/query-client';
import { colors } from '@/theme';
import { MockTag } from '@/ui/MockTag';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { t } = useTranslation();
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
                <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground, contentStyle: { backgroundColor: colors.background }, headerBackButtonDisplayMode: 'minimal' }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
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
                  <Stack.Screen name="account/coupons" options={{ title: t('account.coupons.title') }} />
                  <Stack.Screen name="account/email" options={{ title: t('account.email.title') }} />
                  <Stack.Screen name="account/notifications" options={{ title: t('account.notifications.title') }} />
                  <Stack.Screen name="account/feedback" options={{ title: t('account.feedback.title') }} />
                  <Stack.Screen name="account/security" options={{ title: t('account.security.title') }} />
                  <Stack.Screen name="account/more" options={{ title: t('account.more.title') }} />
                  <Stack.Screen name="rewards" options={{ title: t('rewards.title') }} />
                  <Stack.Screen name="legal/[page]" options={({ route }) => ({ title: (route.params as { page?: string } | undefined)?.page === 'terms' ? t('account.more.terms') : t('account.more.privacy') })} />
                  <Stack.Screen name="delete-account" options={{ title: t('deleteAccount.title') }} />
                  <Stack.Screen name="campaigns/[id]" options={{ title: t('campaigns.title') }} />
                  <Stack.Screen name="restaurant/[branchId]" options={{ headerTransparent: true, headerTitle: '', headerBackButtonDisplayMode: 'minimal' }} />
                  <Stack.Screen
                    name="product/[id]"
                    options={{ presentation: 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, headerShown: false, contentStyle: { backgroundColor: colors.card } }}
                  />
                </Stack>
              </HomeViewProvider>
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
