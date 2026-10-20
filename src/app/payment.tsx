import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Clock, Lock, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { PORTAL_WEB_ORIGIN } from '@/config';
import { orderHref, parsePaymentCallback, type PaymentCallback } from '@/lib/checkout';
import { clearPendingPayment, getPendingPayment } from '@/lib/pending-payment';
import { qk } from '@/queries/keys';
import { getPayment, isFailedPayment, isPaid, waitForPayment } from '@/services/payment.service';
import type { PaymentRecord } from '@/types/order';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

const CONFIRMING_MS = 2500;

/**
 * The provider's hosted page (or iyzico's form) inside the app. The provider returns to
 * `{portal origin}/payment/callback?status=…`; that request is intercepted here and never loads the portal.
 * The result is confirmed against the payment record, because the redirect alone is not proof of payment.
 */
export default function PaymentScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [pending] = useState(getPendingPayment);
  const [failed, setFailed] = useState(!pending);
  const [checking, setChecking] = useState(false);
  // The provider said yes but the payment record has not caught up: not a failure, the order list will show the outcome.
  const [confirming, setConfirming] = useState(false);
  const handled = useRef(false);

  /** The order is placed (or the person walks away): the cart is whatever the server says now. */
  const settle = () => {
    clearPendingPayment();
    void queryClient.invalidateQueries({ queryKey: qk.cart });
    void queryClient.invalidateQueries({ queryKey: qk.orders });
  };

  const toOrder = (orderId: string | null) => {
    settle();
    if (orderId && pending) router.replace(orderHref({ id: orderId, branchId: pending.branchId, brandId: pending.brandId }));
    // Without an id the order list is the honest place to look; the order screen needs one.
    else router.replace('/(tabs)/orders');
  };

  const fail = () => {
    settle();
    setChecking(false);
    setFailed(true);
  };

  const toOrders = () => {
    settle();
    router.replace('/(tabs)/orders');
  };

  const confirmLater = () => {
    settle();
    setChecking(false);
    setConfirming(true);
  };

  const finish = async (result: PaymentCallback): Promise<void> => {
    if (handled.current || !pending) return;
    handled.current = true;
    if (result.status === 'failure') return fail();
    setChecking(true);
    let record: PaymentRecord | null = null;
    try {
      record = await waitForPayment(result.paymentId ?? pending.paymentId);
    } catch {
      // The read failed, not the payment.
    }
    if (record && isPaid(record)) return toOrder(result.orderId ?? record.orderId);
    if (record && isFailedPayment(record)) return fail();
    // A late webhook (or a read that failed) leaves the answer open although the provider said success.
    confirmLater();
  };

  const intercept = (request: { url: string }): boolean => {
    const result = parsePaymentCallback(request.url);
    if (!result) return true;
    void finish(result);
    return false;
  };

  const leave = async () => {
    if (handled.current) return;
    handled.current = true;
    setChecking(true);
    // One look at the record: the person may have paid just before closing.
    const record = pending ? await getPayment(pending.paymentId).catch(() => null) : null;
    if (record && isPaid(record)) return toOrder(record.orderId);
    // A read that failed proves nothing either way: the order list is the honest place.
    if (!record && pending) return toOrders();
    settle();
    router.replace('/cart');
  };

  const confirmLeave = () => {
    if (handled.current) return;
    Alert.alert(t('payment.leaveTitle'), t('payment.leaveBody'), [
      { text: t('payment.leaveStay'), style: 'cancel' },
      { text: t('payment.leaveConfirm'), style: 'destructive', onPress: () => void leave() },
    ]);
  };

  // The Android back button asks the same question as the X; the failure screen has nothing to ask, so it just goes back.
  const onBack = (): boolean => {
    if (failed) return false;
    if (confirming) toOrders();
    else confirmLeave();
    return true;
  };
  const backRef = useRef(onBack);
  useEffect(() => {
    backRef.current = onBack;
  });
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => backRef.current());
    return () => sub.remove();
  }, []);

  // Leave the neutral screen by itself; the button below does it at once.
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => router.replace('/(tabs)/orders'), CONFIRMING_MS);
    return () => clearTimeout(timer);
  }, [confirming]);

  // The payment sits on top of checkout: back is "try again" with a fresh POST /payments/initialize.
  const retry = () => (router.canGoBack() ? router.back() : router.replace('/checkout'));

  const source = pending?.paymentUrl ? { uri: pending.paymentUrl } : { html: pending?.checkoutFormContent ?? '', baseUrl: PORTAL_WEB_ORIGIN };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={confirmLeave} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('payment.close')} disabled={failed || confirming}>
          <X size={24} color={failed || confirming ? colors.border : colors.foreground} />
        </Pressable>
        <Lock size={16} color={colors.success} />
        <Text style={styles.title}>{t('payment.title')}</Text>
      </View>
      {confirming ? (
        <View style={styles.center}>
          <EmptyState icon={<Clock size={32} color={colors.primarySoftForeground} />} title={t('payment.confirmingTitle')} body={t('payment.confirmingBody')} actionLabel={t('payment.toOrders')} onAction={toOrders} />
        </View>
      ) : failed ? (
        <View style={styles.center}>
          <EmptyState icon={<X size={32} color={colors.destructive} />} title={t('payment.failed')} body={t('payment.failedBody')} />
          <View style={styles.actions}>
            <Button title={t('payment.retry')} onPress={retry} />
            <Button title={t('payment.backToCart')} variant="secondary" onPress={() => router.replace('/cart')} />
          </View>
        </View>
      ) : checking ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.checking}>{t('payment.checking')}</Text>
        </View>
      ) : (
        <WebView
          source={source}
          originWhitelist={['*']}
          onShouldStartLoadWithRequest={intercept}
          onNavigationStateChange={(state: WebViewNavigation): void => {
            const result = parsePaymentCallback(state.url);
            if (result) void finish(result);
          }}
          startInLoadingState
          renderLoading={(): React.ReactElement => <ActivityIndicator style={StyleSheet.absoluteFill} color={colors.primary} />}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
          style={styles.web}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.card },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { flex: 1, fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  center: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.md },
  checking: { fontSize: font.body, color: colors.mutedForeground, textAlign: 'center' },
  actions: { gap: space.sm },
  web: { flex: 1 },
});
