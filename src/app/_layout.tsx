import '@/i18n';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import { loadLanguage } from '@/lib/language';
import { bindAppFocus, queryClient } from '@/lib/query-client';
import { colors } from '@/theme';

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
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.foreground, contentStyle: { backgroundColor: colors.background }, headerBackButtonDisplayMode: 'minimal' }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding/address" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="addresses/index" options={{ title: t('addresses.title') }} />
                <Stack.Screen name="addresses/form" options={({ route }) => ({ title: (route.params as { id?: string } | undefined)?.id ? t('addresses.editTitle') : t('addresses.newTitle') })} />
                <Stack.Screen name="restaurant/[branchId]" options={{ headerTransparent: true, headerTitle: '', headerBackButtonDisplayMode: 'minimal' }} />
                <Stack.Screen
                  name="product/[id]"
                  options={{ presentation: 'formSheet', sheetAllowedDetents: [0.92], sheetGrabberVisible: true, headerShown: false, contentStyle: { backgroundColor: colors.card } }}
                />
              </Stack>
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
