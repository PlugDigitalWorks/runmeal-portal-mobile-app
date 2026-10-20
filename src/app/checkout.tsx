import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { MapPin, Store } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddressSheet } from '@/components/AddressSheet';
import { OptionRow } from '@/components/checkout/OptionRow';
import { Section } from '@/components/checkout/Section';
import { Segmented } from '@/components/checkout/Segmented';
import { SlotPicker } from '@/components/checkout/SlotPicker';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { addressFirstLine, addressSecondLine } from '@/lib/address';
import { apiErrorMessage } from '@/lib/api-error';
import { settingsOf } from '@/lib/branch-model';
import { cartLinesFromBackend, summarize } from '@/lib/cart-model';
import {
  deliveryCovered,
  isDelivery,
  isScheduled,
  orderHref,
  orderTypesFor,
  paymentMethodsForOrder,
  resolveOrderType,
  type OrderTypeChoice,
} from '@/lib/checkout';
import { formatMoney } from '@/lib/money';
import { setPendingPayment } from '@/lib/pending-payment';
import { qk } from '@/queries/keys';
import { useBranch } from '@/queries/useBranch';
import { useCart } from '@/queries/useCart';
import { getBranchAvailability, getFulfillmentSlots, getNearbyBranches } from '@/services/branch.service';
import { cartIdOf } from '@/services/cart.service';
import { getCreditBalance } from '@/services/loyalty.service';
import { initializePayment, waitForPayment } from '@/services/payment.service';
import { colors, font, radius, space, weight } from '@/theme';
import type { PaymentMethod, ScheduledOrderType } from '@/types/order';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { TextField } from '@/ui/TextField';

type SlotPick = { type: string; day: string; value: string | null };

/**
 * The checkout of the marketplace cart: order type, address and delivery coverage, a scheduled time, payment
 * method, credit, note and the order summary. Card payments continue in the in-app payment screen; cash and
 * card on delivery place the order right here.
 */
export default function CheckoutScreen() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith('en') ? 'en' : 'tr';
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { status } = useAuth();
  const { activeAddress, coords } = useLocation();

  const { data: cart, isPending: cartPending, isError: cartError, refetch: refetchCart } = useCart();
  const cartId = cartIdOf(cart);
  const branchId = cart?.branchId ?? '';
  const { data: branch, isError: branchError, refetch: refetchBranch } = useBranch(branchId);
  const availability = useQuery({ queryKey: qk.availability(branchId), queryFn: () => getBranchAvailability(branchId), enabled: !!branchId });
  // Same key as the home feed: the nearby result for this address is the coverage answer, and an address change refreshes both.
  const coverage = useQuery({
    queryKey: coords ? qk.nearby(coords.latitude, coords.longitude) : [...qk.nearbyAll, 'none'],
    queryFn: () => getNearbyBranches(coords!),
    enabled: !!coords && !!branchId,
  });
  const credit = useQuery({ queryKey: qk.credit, queryFn: getCreditBalance, enabled: status === 'signedIn' });

  const [choice, setChoice] = useState<OrderTypeChoice | null>(null);
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [useCredit, setUseCredit] = useState(false);
  const [pick, setPick] = useState<SlotPick | null>(null);
  const [note, setNote] = useState('');
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const submitting = useRef(false);

  // Delivery is offered only where the API says the branch reaches the address; a failed coverage call must not block the order.
  const covered = coverage.data ? deliveryCovered(branchId, coverage.data) : true;
  const offered = branch ? orderTypesFor(settingsOf(branch)) : [];
  const types = covered ? offered : offered.filter((type) => !isDelivery(type));
  const notCovered = !covered && offered.some(isDelivery);
  const orderType = resolveOrderType(types, choice);
  const delivery = orderType ? isDelivery(orderType) : false;
  const scheduled = orderType ? isScheduled(orderType) : false;
  const coverageLoading = delivery && !!coords && coverage.isPending;

  const slotsQuery = useQuery({
    queryKey: qk.slots(branchId, orderType ?? ''),
    queryFn: () => getFulfillmentSlots(branchId, orderType as ScheduledOrderType),
    enabled: !!branchId && scheduled,
  });
  const days = (slotsQuery.data?.available ? slotsQuery.data.dates : []).filter((d) => d.slots.length > 0);
  // A time picked for one scheduled type never carries over to the other, and one the API dropped is forgotten.
  const mine = pick?.type === orderType ? pick : null;
  const slot = mine?.value && days.some((d) => d.slots.some((s) => s.value === mine.value)) ? mine.value : null;

  const methods = branch && orderType ? paymentMethodsForOrder(settingsOf(branch), orderType) : [];
  const currentMethod = method && methods.includes(method) ? method : (methods[0] ?? null);

  const lines = cartLinesFromBackend(cart ?? null);
  const summary = summarize(lines, cart ?? null);
  const currency = branch?.currency ?? 'TRY';
  const symbol = branch?.currencySymbol;
  const money = (value: number) => formatMoney(value, currency, { symbol });
  const balance = credit.data ?? 0;
  const creditUsed = useCredit && balance > 0 ? Math.round(Math.min(balance, summary.total) * 100) / 100 : 0;
  const due = Math.max(0, summary.total - creditUsed);

  if (cartError && !cart) return <Centered><ErrorState message={t('checkout.loadFailed')} onRetry={refetchCart} /></Centered>;
  if (cartPending) return <Centered><ActivityIndicator color={colors.primary} /></Centered>;
  if (!cart || !cartId || lines.length === 0) {
    return (
      <Centered>
        <EmptyState icon={<Store size={32} color={colors.primarySoftForeground} />} title={t('cart.emptyTitle')} actionLabel={t('cart.browse')} onAction={() => router.dismissTo('/(tabs)')} />
      </Centered>
    );
  }
  if (branchError && !branch) return <Centered><ErrorState message={t('checkout.loadFailed')} onRetry={refetchBranch} /></Centered>;
  if (!branch) return <Centered><ActivityIndicator color={colors.primary} /></Centered>;

  if (types.length === 0) {
    return (
      <>
        <Centered>
          {notCovered ? (
            <EmptyState icon={<MapPin size={32} color={colors.primarySoftForeground} />} title={t('checkout.notCovered')} actionLabel={t('checkout.changeAddress')} onAction={() => setSheet(true)} />
          ) : (
            <EmptyState
              icon={<Store size={32} color={colors.primarySoftForeground} />}
              title={t('checkout.noOrderTypes')}
              body={t('checkout.noOrderTypesBody')}
              actionLabel={t('cart.browse')}
              onAction={() => router.dismissTo('/(tabs)')}
            />
          )}
        </Centered>
        <AddressSheet visible={sheet} onClose={() => setSheet(false)} />
      </>
    );
  }

  const closed = availability.data?.canAcceptOrders === false;
  const timings: { value: 'now' | 'scheduled'; label: string }[] = [];
  if (types.some((type) => isDelivery(type) === delivery && !isScheduled(type))) timings.push({ value: 'now', label: t('checkout.timingNow') });
  if (types.some((type) => isDelivery(type) === delivery && isScheduled(type))) timings.push({ value: 'scheduled', label: t('checkout.timingScheduled') });
  const kinds: { value: 'delivery' | 'pickup'; label: string }[] = [];
  if (types.some(isDelivery)) kinds.push({ value: 'delivery', label: t('restaurant.delivery') });
  if (types.some((type) => !isDelivery(type))) kinds.push({ value: 'pickup', label: t('restaurant.pickup') });

  const placeOrder = async () => {
    // A fast double tap lands before `busy` re-renders the button; the ref stops the second order.
    if (submitting.current || !orderType) return;
    if (!currentMethod) return setFormError(t('checkout.noMethods'));
    if (scheduled && !slot) return setFormError(t('checkout.chooseSlot'));
    if (delivery && !activeAddress) return setFormError(t('checkout.chooseAddress'));
    if (delivery && !activeAddress?.phoneE164) return setFormError(t('checkout.phoneRequired'));

    submitting.current = true;
    setBusy(true);
    setFormError(null);
    const brandId = cart.brandId || branch.brandId;
    try {
      // The branch may have closed since the screen opened; the API's answer is the final one.
      const now = await queryClient.fetchQuery({ queryKey: qk.availability(branchId), queryFn: () => getBranchAvailability(branchId), staleTime: 0 });
      if (!now.canAcceptOrders) {
        setFormError(now.reason ?? t('checkout.unavailable'));
        return;
      }
      const payment = await initializePayment({
        cartId,
        branchId,
        brandId,
        paymentMethod: currentMethod,
        orderType,
        ...(scheduled && slot ? { scheduledFor: slot } : {}),
        creditUsedAmount: creditUsed,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      if (payment.paymentUrl || payment.checkoutFormContent) {
        setPendingPayment({ paymentId: payment.paymentId, cartId, branchId, brandId, paymentUrl: payment.paymentUrl, checkoutFormContent: payment.checkoutFormContent });
        router.push('/payment');
        return;
      }
      // Cash, card on delivery or a fully credit-paid order: it exists already; the payment record knows the order id if the answer did not.
      const orderId = payment.orderId ?? (await waitForPayment(payment.paymentId)).orderId;
      void queryClient.invalidateQueries({ queryKey: qk.cart });
      void queryClient.invalidateQueries({ queryKey: qk.orders });
      if (orderId) router.replace(orderHref({ id: orderId, branchId, brandId }));
      else router.replace('/(tabs)/orders');
    } catch (error) {
      // A slot that went stale between loading and ordering: show a fresh list instead of retrying it.
      if (scheduled) {
        setPick(null);
        void slotsQuery.refetch();
      }
      Alert.alert(apiErrorMessage(error, t('checkout.failed')));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Section title={t('checkout.orderType')}>
          {notCovered ? (
            <View style={styles.notice}>
              <MapPin size={16} color={colors.destructive} />
              <Text style={styles.noticeText}>{t('checkout.notCovered')}</Text>
            </View>
          ) : null}
          <Segmented
            options={kinds}
            value={delivery ? 'delivery' : 'pickup'}
            onChange={(kind) => setChoice({ delivery: kind === 'delivery', scheduled })}
          />
          {timings.length > 1 ? (
            <Segmented options={timings} value={scheduled ? 'scheduled' : 'now'} onChange={(timing) => setChoice({ delivery, scheduled: timing === 'scheduled' })} />
          ) : null}
        </Section>

        {delivery ? (
          <Section title={t('checkout.address')}>
            <View style={styles.addressRow}>
              <MapPin size={20} color={colors.primary} />
              <View style={styles.addressText}>
                {activeAddress ? (
                  <>
                    <Text style={styles.addressLine}>{addressFirstLine(activeAddress)}</Text>
                    <Text style={styles.muted}>{addressSecondLine(activeAddress)}</Text>
                  </>
                ) : (
                  <Text style={styles.muted}>{t('checkout.chooseAddress')}</Text>
                )}
              </View>
              <Pressable onPress={() => setSheet(true)} hitSlop={10} accessibilityRole="button">
                <Text style={styles.link}>{activeAddress ? t('checkout.changeAddress') : t('checkout.addAddress')}</Text>
              </Pressable>
            </View>
          </Section>
        ) : null}

        {scheduled ? (
          <Section title={t('checkout.when')}>
            {slotsQuery.isPending ? (
              <ActivityIndicator color={colors.primary} />
            ) : slotsQuery.isError ? (
              <ErrorState message={t('checkout.slotsLoadFailed')} onRetry={slotsQuery.refetch} />
            ) : days.length === 0 ? (
              <Text style={styles.muted}>{t('checkout.noSlots')}</Text>
            ) : (
              <SlotPicker
                dates={days}
                lang={lang}
                day={mine?.day}
                slot={slot}
                onDay={(day) => setPick({ type: orderType!, day, value: null })}
                onSlot={(day, value) => setPick({ type: orderType!, day, value })}
              />
            )}
          </Section>
        ) : null}

        <Section title={t('checkout.payment')}>
          {methods.length === 0 ? <Text style={styles.muted}>{t('checkout.noMethods')}</Text> : null}
          {methods.map((m) => (
            <OptionRow key={m} label={t(`checkout.method.${m}`)} selected={m === currentMethod} onPress={() => setMethod(m)} />
          ))}
          {balance > 0 ? (
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>{t('checkout.useCredit', { amount: money(balance) })}</Text>
              <Switch
                value={useCredit}
                onValueChange={setUseCredit}
                trackColor={{ true: colors.primary }}
                accessibilityLabel={t('checkout.useCredit', { amount: money(balance) })}
              />
            </View>
          ) : null}
        </Section>

        <Section>
          <TextField
            label={t('checkout.note')}
            value={note}
            onChangeText={setNote}
            placeholder={t('checkout.notePlaceholder')}
            multiline
            maxLength={500}
            style={styles.noteInput}
          />
        </Section>

        <Section title={t('checkout.summary')}>
          {lines.map((line) => (
            <View key={line.id} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {line.qty}× {line.name}
              </Text>
              <Text style={styles.rowValue}>{money(line.lineTotal)}</Text>
            </View>
          ))}
          {summary.discount > 0 ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('cart.discount')}</Text>
              <Text style={[styles.rowValue, { color: colors.success }]}>-{money(summary.discount)}</Text>
            </View>
          ) : null}
          {creditUsed > 0 ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>{t('checkout.credit')}</Text>
              <Text style={[styles.rowValue, { color: colors.success }]}>-{money(creditUsed)}</Text>
            </View>
          ) : null}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>{t('cart.total')}</Text>
            <Text style={styles.totalLabel}>{money(due)}</Text>
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        {closed ? (
          <Text style={styles.closed}>{availability.data?.reason ?? t('checkout.unavailable')}</Text>
        ) : (
          <>
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <Button title={`${t('checkout.confirm')} · ${money(due)}`} onPress={placeOrder} loading={busy || coverageLoading} disabled={!currentMethod} />
          </>
        )}
      </View>
      <AddressSheet visible={sheet} onClose={() => setSheet(false)} />
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <View style={styles.center}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md, paddingBottom: space.xxl },
  notice: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md, backgroundColor: colors.destructiveSoft },
  noticeText: { flex: 1, fontSize: font.body, color: colors.destructive },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  addressText: { flex: 1, gap: 2 },
  addressLine: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  muted: { fontSize: font.body, color: colors.mutedForeground },
  link: { fontSize: font.body, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  creditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingTop: space.xs },
  creditLabel: { flex: 1, fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground },
  noteInput: { height: 88, paddingTop: space.md, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  rowLabel: { flex: 1, fontSize: font.body, color: colors.mutedForeground },
  rowValue: { fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground },
  totalRow: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: space.md },
  totalLabel: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  footer: { gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  error: { fontSize: font.body, color: colors.destructive, textAlign: 'center' },
  closed: { fontSize: font.base, fontWeight: weight.semibold, color: colors.destructive, textAlign: 'center', paddingVertical: space.md },
});
