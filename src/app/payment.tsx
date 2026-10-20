import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Lock, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewNavigation } from 'react-native-webview';
import { PORTAL_WEB_ORIGIN } from '@/config';
import { orderHref, parsePaymentCallback, type PaymentCallback } from '@/lib/checkout';
import { clearPendingPayment, getPendingPayment } from '@/lib/pending-payment';
import { qk } from '@/queries/keys';
import { getPayment, isPaid, waitForPayment } from '@/services/payment.service';
import type { PaymentRecord } from '@/types/order';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

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

  const finish = async (result: PaymentCallback): Promise<void> => {
    if (handled.current || !pending) return;
    handled.current = true;
    if (result.status === 'failure') return fail();
    setChecking(true);
    let record: PaymentRecord | null = null;
    try {
      record = await waitForPayment(result.paymentId ?? pending.paymentId);
    } catch {
      // The read failed, not the payment: the callback's own order id still leads somewhere real.
    }
    if (record && isPaid(record)) return toOrder(result.orderId ?? record.orderId);
    // A late webhook leaves the record pending although the provider said success; the order exists, its screen tracks it.
    if (result.orderId) return toOrder(result.orderId);
    fail();
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

  // The Android back button asks the same question as the X.
  const confirmRef = useRef(confirmLeave);
  useEffect(() => {
    confirmRef.current = confirmLeave;
  });
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      confirmRef.current();
      return true;
    });
    return () => sub.remove();
  }, []);

  const source = pending?.paymentUrl ? { uri: pending.paymentUrl } : { html: pending?.checkoutFormContent ?? '', baseUrl: PORTAL_WEB_ORIGIN };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={confirmLeave} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('payment.close')} disabled={failed}>
          <X size={24} color={failed ? colors.border : colors.foreground} />
        </Pressable>
        <Lock size={16} color={colors.success} />
        <Text style={styles.title}>{t('payment.title')}</Text>
      </View>
      {failed ? (
        <View style={styles.center}>
          <EmptyState icon={<X size={32} color={colors.destructive} />} title={t('payment.failed')} body={t('payment.failedBody')} />
          <View style={styles.actions}>
            <Button title={t('payment.retry')} onPress={() => router.replace('/checkout')} />
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
