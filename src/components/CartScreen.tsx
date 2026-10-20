import { router, Stack, type Href } from 'expo-router';
import { ShoppingBag } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartLineRow } from '@/components/CartLineRow';
import { apiErrorMessage } from '@/lib/api-error';
import { cartLinesFromBackend, summarize, type CartLine } from '@/lib/cart-model';
import { formatMoney, formatMoneyWhole } from '@/lib/money';
import { useBranch } from '@/queries/useBranch';
import { useApplyPromotion, useCart, useRemoveCartLine, useRemovePromotion, useUpdateCartLine } from '@/queries/useCart';
import { cartIdOf } from '@/services/cart.service';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { TextField } from '@/ui/TextField';

type Props = {
  /**
   * `stack`: pushed from the cart bar, with the navigation header showing the restaurant.
   * `tab`: the Sepetim tab, which has no header, so the screen draws its own title and the tab bar owns the bottom inset.
   */
  variant?: 'stack' | 'tab';
};

/** The single marketplace cart: lines with steppers, a promo code, the totals and the way on to checkout. */
export function CartScreen({ variant = 'stack' }: Props) {
  const tab = variant === 'tab';
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: cart, isPending, isError, refetch } = useCart();
  const { data: branch } = useBranch(cart?.branchId ?? '');
  const updateLine = useUpdateCartLine();
  const removeLine = useRemoveCartLine();
  const applyPromo = useApplyPromotion();
  const removePromo = useRemovePromotion();
  const [code, setCode] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const cartId = cartIdOf(cart);
  const lines = cartLinesFromBackend(cart ?? null);
  const currency = branch?.currency ?? 'TRY';
  const scope = cart ? { branchId: cart.branchId, brandId: cart.brandId } : null;
  const busy = updateLine.isPending || removeLine.isPending;
  // Inside the tabs a Stack.Screen would rename the tab itself, so the tab draws its own title instead.
  const header = tab ? (
    <View style={[styles.tabHeader, { paddingTop: insets.top + space.md }]}>
      <Text style={styles.tabTitle}>{t('cart.title')}</Text>
      {branch?.name ? <Text style={styles.tabSubtitle}>{branch.name}</Text> : null}
    </View>
  ) : (
    <Stack.Screen options={{ title: branch?.name ?? t('cart.title') }} />
  );

  if (isError && !cart) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <ErrorState message={t('cart.loadFailed')} onRetry={refetch} />
        </View>
      </View>
    );
  }
  if (isPending) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }
  if (!cart || !cartId || !scope || lines.length === 0) {
    return (
      <View style={styles.root}>
        {header}
        <View style={styles.center}>
          <EmptyState
            icon={<ShoppingBag size={32} color={colors.primarySoftForeground} />}
            title={t('cart.emptyTitle')}
            actionLabel={t('cart.browse')}
            onAction={() => (tab ? router.navigate('/(tabs)') : router.dismissTo('/(tabs)'))}
          />
        </View>
      </View>
    );
  }

  const summary = summarize(lines, cart);
  const fail = (error: unknown, fallback: string) => Alert.alert(apiErrorMessage(error, fallback));

  const onQty = (line: CartLine, qty: number) => {
    const options = { onError: (error: unknown) => fail(error, t('cart.updateFailed')) };
    // Zero is a removal: the stepper may go down to it, the API has no zero quantity.
    if (qty < 1) removeLine.mutate({ itemId: line.id, scope }, options);
    else updateLine.mutate({ itemId: line.id, qty, scope }, options);
  };

  const onApply = () => {
    const promotionCode = code.trim();
    if (!promotionCode) return;
    setPromoError(null);
    applyPromo.mutate(
      { cartId, promotionCode, scope },
      {
        onSuccess: () => setCode(''),
        onError: (error) => setPromoError(apiErrorMessage(error, t('cart.promoFailed'))),
      },
    );
  };

  const onCheckout = () => {
    const minimum = branch?.minBasketPrice != null ? Number(branch.minBasketPrice) : null;
    // Unknown minimum: the checkout call is the one that judges it.
    if (minimum != null && summary.total < minimum) {
      Alert.alert(t('cart.minBasket', { amount: formatMoneyWhole(minimum, currency) }));
      return;
    }
    // The checkout screen arrives with Task 10; the cast keeps typed routes happy until it exists.
    router.push('/checkout' as Href);
  };

  return (
    <View style={styles.root}>
      {header}
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {lines.map((line) => (
          <CartLineRow key={line.id} line={line} currency={currency} busy={busy} onQty={(qty) => onQty(line, qty)} />
        ))}

        <View style={styles.section}>
          <View style={styles.promoRow}>
            <View style={{ flex: 1 }}>
              <TextField
                label={t('cart.promoLabel')}
                value={code}
                onChangeText={(text) => {
                  setCode(text);
                  setPromoError(null);
                }}
                placeholder={t('cart.promoPlaceholder')}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            <View>
              <Button title={t('cart.apply')} variant="secondary" onPress={onApply} loading={applyPromo.isPending} disabled={!code.trim()} />
            </View>
          </View>
          {promoError ? <Text style={styles.promoError}>{promoError}</Text> : null}
          {(cart.appliedPromotions ?? []).map((promotion) => (
            <View key={promotion.promotionCode} style={styles.applied}>
              <Text style={styles.appliedName}>{promotion.name || promotion.promotionCode}</Text>
              <Pressable
                onPress={() =>
                  removePromo.mutate({ cartId, promotionCode: promotion.promotionCode, scope }, { onError: (error) => fail(error, t('cart.updateFailed')) })
                }
                disabled={removePromo.isPending}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${t('cart.removePromo')} ${promotion.promotionCode}`}
              >
                <Text style={styles.removePromo}>{t('cart.removePromo')}</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <SummaryRow label={t('cart.subtotal')} value={formatMoney(summary.subtotal, currency)} />
          {summary.discount > 0 ? <SummaryRow label={t('cart.discount')} value={`-${formatMoney(summary.discount, currency)}`} tone="success" /> : null}
          <SummaryRow label={t('cart.total')} value={formatMoney(summary.total, currency)} strong />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: tab ? space.md : Math.max(insets.bottom, space.md) }]}>
        <Button title={t('cart.checkout')} onPress={onCheckout} />
      </View>
    </View>
  );
}

type RowProps = { label: string; value: string; strong?: boolean; tone?: 'success' };

function SummaryRow({ label, value, strong, tone }: RowProps) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong, tone === 'success' && { color: colors.success }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  content: { paddingHorizontal: space.lg, paddingBottom: space.xxl },
  section: { gap: space.sm, paddingVertical: space.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  promoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm },
  promoError: { fontSize: font.small, color: colors.destructive },
  applied: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.successSoft, borderRadius: radius.md, padding: space.md },
  appliedName: { flex: 1, fontSize: font.body, fontWeight: weight.semibold, color: colors.success },
  removePromo: { fontSize: font.body, fontWeight: weight.semibold, color: colors.destructive },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: font.body, color: colors.mutedForeground },
  summaryValue: { fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground },
  tabHeader: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: 2 },
  tabTitle: { fontSize: font.display, fontWeight: weight.bold, color: colors.foreground },
  tabSubtitle: { fontSize: font.body, color: colors.mutedForeground },
  summaryStrong: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
