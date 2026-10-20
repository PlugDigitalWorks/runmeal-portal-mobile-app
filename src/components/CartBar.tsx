import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { cartLinesFromBackend, summarize } from '@/lib/cart-model';
import { formatMoney } from '@/lib/money';
import { useBranch } from '@/queries/useBranch';
import { useCart } from '@/queries/useCart';
import { colors, font, radius, shadow, space, weight } from '@/theme';

type Props = {
  /** Add the bottom safe-area inset; the tab bar already owns it, plain screens do not. */
  safeBottom?: boolean;
};

/** Floating "view cart" bar: item count, the branch it belongs to and the total. Renders nothing for an empty cart. */
export function CartBar({ safeBottom }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: cart } = useCart();
  // Served from the cache when the restaurant page already loaded it; the cart row itself has no name or currency.
  const { data: branch } = useBranch(cart?.branchId ?? '');
  const lines = cartLinesFromBackend(cart ?? null);
  if (!cart || lines.length === 0) return null;
  const summary = summarize(lines, cart);

  return (
    <View style={[styles.wrap, safeBottom && { paddingBottom: Math.max(insets.bottom, space.sm) }]}>
      <Pressable style={styles.bar} onPress={() => router.push('/cart')} accessibilityRole="button" accessibilityLabel={t('cart.viewCart')}>
        <View style={styles.count}>
          <Text style={styles.countText}>{summary.count}</Text>
        </View>
        <View style={styles.middle}>
          <Text style={styles.title}>{t('cart.viewCart')}</Text>
          {branch?.name ? (
            <Text style={styles.branch} numberOfLines={1}>
              {branch.name}
            </Text>
          ) : null}
        </View>
        <Text style={styles.total}>{formatMoney(summary.total, branch?.currency ?? 'TRY', { symbol: branch?.currencySymbol })}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm },
  bar: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    ...shadow.card,
  },
  count: { minWidth: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  countText: { fontSize: font.body, fontWeight: weight.bold, color: colors.primarySoftForeground },
  middle: { flex: 1 },
  title: { fontSize: font.base, fontWeight: weight.bold, color: colors.primaryForeground },
  branch: { fontSize: font.small, color: colors.primaryForeground, opacity: 0.9 },
  total: { fontSize: font.base, fontWeight: weight.bold, color: colors.primaryForeground },
});
