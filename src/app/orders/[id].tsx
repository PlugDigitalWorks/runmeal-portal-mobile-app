import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, Truck, XCircle } from 'lucide-react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, BackHandler, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { OrderStatusSteps } from '@/components/OrderStatusSteps';
import { SHOW_MOCKS } from '@/config';
import { isDelivery } from '@/lib/checkout';
import { formatMoney } from '@/lib/money';
import { formatOrderDate, humanize, itemOptions, itemQuantity, itemTotal, mockEta } from '@/lib/order-display';
import { isFinal } from '@/lib/order-status';
import { MOCK_COURIER } from '@/mocks/order-mocks';
import { qk } from '@/queries/keys';
import { useBranch } from '@/queries/useBranch';
import { useOrder } from '@/queries/useOrders';
import type { OrderDetails, OrderType } from '@/types/order';
import { colors, font, radius, space, weight } from '@/theme';
import { ErrorState } from '@/ui/ErrorState';
import { MockTag } from '@/ui/MockTag';

/**
 * Order confirmation (`placed=1`, straight after checkout) and live tracking: the order is re-read every
 * few seconds until it is delivered or cancelled (see useOrder).
 */
export default function OrderScreen() {
  const { t, i18n } = useTranslation();
  const { id, branchId = '', brandId, placed } = useLocalSearchParams<{ id: string; branchId?: string; brandId?: string; placed?: string }>();
  const queryClient = useQueryClient();
  const { data: order, isError, isRefetching, refetch } = useOrder(id, { branchId, brandId });
  const { data: branch } = useBranch(branchId);
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
  const status = order?.status;

  // The list tab keeps its own copy; a status change here would leave it saying "Aktif" for a delivered order.
  useEffect(() => {
    if (status) void queryClient.invalidateQueries({ queryKey: qk.orders });
  }, [status, queryClient]);

  // This screen replaced checkout (or the payment screen), and back must not return to checkout or payment.
  // After an order, back means the tabs: the header button, the iOS swipe (off) and Android's back key agree.
  const justPlaced = placed === '1';
  useEffect(() => {
    if (!justPlaced) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.dismissTo('/(tabs)');
      return true;
    });
    return () => sub.remove();
  }, [justPlaced]);
  const headerLeft = justPlaced
    ? () => (
        <Pressable onPress={() => router.dismissTo('/(tabs)')} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('orders.back')}>
          <ChevronLeft size={26} color={colors.foreground} />
        </Pressable>
      )
    : undefined;

  return (
    <>
      <Stack.Screen options={{ title: order ? t('orders.number', { number: order.orderNumber }) : t('orders.detailTitle'), headerLeft, gestureEnabled: !justPlaced }} />
      {isError && !order ? (
        <ErrorState message={t('orders.detailFailed')} onRetry={() => void refetch()} />
      ) : !order ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
        >
          {justPlaced ? (
            <View style={styles.placed}>
              <CheckCircle2 size={22} color={colors.success} />
              <View style={styles.placedText}>
                <Text style={styles.placedTitle}>{t('orders.placed')}</Text>
                <Text style={styles.placedBody}>{t('orders.placedBody')}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.card}>
            {/* No pill here: the timeline below already names the status. */}
            <Text style={styles.restaurant} numberOfLines={1}>
              {branch?.name ?? t('orders.number', { number: order.orderNumber })}
            </Text>
            <Text style={styles.meta}>{[`#${order.orderNumber}`, formatOrderDate(order.createdAt, lang)].filter(Boolean).join(' · ')}</Text>
            {order.status.toUpperCase() === 'CANCELLED' ? (
              <View style={styles.cancelled}>
                <XCircle size={20} color={colors.destructive} />
                <Text style={styles.cancelledText}>{t('orders.cancelled')}</Text>
              </View>
            ) : (
              <OrderStatusSteps status={order.status} />
            )}
            {SHOW_MOCKS ? <MockExtras order={order} /> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('orders.items')}</Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <Text style={styles.qty}>{itemQuantity(item)}×</Text>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName}>{item.productName}</Text>
                  {itemOptions(item) ? <Text style={styles.meta}>{itemOptions(item)}</Text> : null}
                  {item.note ? <Text style={styles.meta}>{t('cart.note', { note: item.note })}</Text> : null}
                </View>
                <Text style={styles.itemPrice}>{money(order, itemTotal(item))}</Text>
              </View>
            ))}
            <Totals order={order} />
          </View>

          <View style={styles.card}>
            {order.orderType ? <Info label={t('orders.type')} value={t(`orders.types.${order.orderType}`, { defaultValue: humanize(order.orderType) })} /> : null}
            {order.paymentMethod ? <Info label={t('orders.payment')} value={t(`checkout.method.${order.paymentMethod}`, { defaultValue: humanize(order.paymentMethod) })} /> : null}
            {order.scheduledFor ? <Info label={t('checkout.when')} value={formatOrderDate(order.scheduledFor, lang)} /> : null}
            {order.addressText ? <Info label={t('checkout.address')} value={order.addressText} /> : null}
          </View>
        </ScrollView>
      )}
    </>
  );
}

const money = (order: OrderDetails, value: number | string | null | undefined) => formatMoney(value, order.currency ?? 'TRY', { symbol: order.currencySymbol });

/** Rows above the total only when there is something to say; they add up to `totalPrice` (lines + tax - discount - credit), which is what was paid. */
function Totals({ order }: { order: OrderDetails }) {
  const { t } = useTranslation();
  const discount = Number(order.discountAmount ?? 0);
  const credit = Number(order.creditUsedAmount ?? 0);
  const tax = Number(order.taxAmount ?? 0);
  const subtotal = order.items.reduce((sum, item) => sum + Number(item.lineTotal ?? itemTotal(item)), 0);
  return (
    <View style={styles.totals}>
      {order.items.length > 0 && (discount > 0 || credit > 0 || tax > 0) ? <Row label={t('orders.subtotal')} value={money(order, subtotal)} /> : null}
      {tax > 0 ? <Row label={t('orders.tax')} value={money(order, tax)} /> : null}
      {discount > 0 ? <Row label={t('orders.discount')} value={`-${money(order, discount)}`} tone={colors.success} /> : null}
      {credit > 0 ? <Row label={t('orders.credit')} value={`-${money(order, credit)}`} tone={colors.success} /> : null}
      <View style={styles.totalLine}>
        <Text style={styles.totalLabel}>{t('orders.total')}</Text>
        <Text style={styles.totalValue}>{money(order, order.totalPrice)}</Text>
      </View>
    </View>
  );
}

/**
 * Uber-style extras the API cannot back yet (docs/BACKEND_REQUESTS.md): an arrival estimate on an open delivery
 * (never pick-up) and the courier once a delivery is ready.
 */
function MockExtras({ order }: { order: OrderDetails }) {
  const { t } = useTranslation();
  const delivery = !!order.orderType && isDelivery(order.orderType as OrderType);
  if (!delivery || isFinal(order.status)) return null;
  const courier = order.status.toUpperCase() === 'READY';
  return (
    <View style={styles.mock}>
      <Text style={styles.eta}>{t('orders.eta', { time: mockEta(order.createdAt) })}</Text>
      {courier ? (
        <View style={styles.courier}>
          <Truck size={18} color={colors.primarySoftForeground} />
          <Text style={styles.courierText}>{t('orders.courier', { name: MOCK_COURIER.name })}</Text>
          <MockTag />
        </View>
      ) : null}
    </View>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <View style={styles.rowLine}>
      <Text style={styles.meta}>{label}</Text>
      <Text style={[styles.itemPrice, tone ? { color: tone } : null]}>{value}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rowLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loading: { marginTop: 48 },
  content: { padding: space.lg, gap: space.lg, paddingBottom: 40 },
  placed: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.successSoft },
  placedText: { flex: 1 },
  placedTitle: { fontSize: font.base, fontWeight: weight.bold, color: colors.success },
  placedBody: { fontSize: font.body, color: colors.mutedForeground },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: space.lg, gap: 10 },
  restaurant: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  meta: { fontSize: font.body, color: colors.mutedForeground },
  cancelled: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: colors.destructiveSoft },
  cancelledText: { flex: 1, fontSize: font.base, fontWeight: weight.semibold, color: colors.destructive },
  mock: { gap: space.sm, paddingTop: space.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  eta: { fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground },
  courier: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  courierText: { flex: 1, fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground },
  sectionTitle: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  item: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  itemBody: { flex: 1 },
  qty: { minWidth: 30, textAlign: 'center', fontSize: font.small, fontWeight: weight.bold, color: colors.mutedForeground, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 2 },
  itemName: { fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
  itemPrice: { fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground },
  totals: { gap: 6, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10 },
  totalLine: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  totalValue: { fontSize: font.title, fontWeight: weight.bold, color: colors.primarySoftForeground },
  rowLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: font.body, color: colors.mutedForeground },
  infoValue: { flexShrink: 1, textAlign: 'right', fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground },
});
