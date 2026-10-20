import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { cartLinesFromBackend, summarize } from '@/lib/cart-model';
import { mockCartReward } from '@/mocks/restaurant-mocks';
import { useCart } from '@/queries/useCart';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import { MockTag } from '@/ui/MockTag';
import { formatMoney } from '@/lib/money';

type Props = { branchId: string; currency: string; symbol?: string | null };

/**
 * Yemeksepeti's reward bar above the cart bar: how much more to add for a coupon. The goal and the coupon are
 * mocks; the basket value is real. Only shown while the cart holds items from this very restaurant.
 */
export function CartProgress({ branchId, currency, symbol }: Props) {
  const { t } = useTranslation();
  const { data: cart } = useCart();
  if (!SHOW_MOCKS || !cart || cart.branchId !== branchId) return null;
  const lines = cartLinesFromBackend(cart);
  if (lines.length === 0) return null;
  const { subtotal } = summarize(lines, cart);
  const { target, reward } = mockCartReward(branchId, currency);
  const whole = (value: number) => formatMoney(value, currency, { symbol, whole: true });
  const earned = subtotal >= target;
  const ratio = Math.max(0, Math.min(1, subtotal / target));

  return (
    <View style={styles.wrap} testID="cart-progress">
      <View style={styles.textRow}>
        <Text style={styles.text}>
          {earned ? t('restaurant.cartProgressDone') : t('restaurant.cartProgress', { amount: whole(target - subtotal), reward: whole(reward) })}
        </Text>
        <MockTag />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.xs, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, backgroundColor: colors.card, ...shadow.card },
  textRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm },
  text: { flexShrink: 1, fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground, textAlign: 'center' },
  track: { height: 6, borderRadius: radius.full, backgroundColor: colors.primarySoft, overflow: 'hidden' },
  fill: { height: 6, borderRadius: radius.full, backgroundColor: colors.primary },
});
