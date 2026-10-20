import { Bike, Info, Store } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import type { Fulfillment } from '@/lib/branch-model';
import { mockDelivery, mockMinBasket } from '@/mocks/home-mocks';
import { mockPrep } from '@/mocks/restaurant-mocks';
import { colors, font, radius, space, weight } from '@/theme';
import { MockTag } from '@/ui/MockTag';
import { formatMoney } from '@/lib/money';

type Props = {
  branchId: string;
  options: Fulfillment[];
  mode: Fulfillment;
  onModeChange: (mode: Fulfillment) => void;
  distanceM: number | null;
  /** The branch's own minimum basket, when the API row carries one. */
  minBasket: number | null;
  currency: string;
  symbol?: string | null;
  addressText: string | null;
};

/**
 * Delivery / pick-up switch (Getir style) and the framed info card under it. Which options exist comes from the
 * branch's real order-type settings; the choice only changes the card's text, it does not reach the cart.
 * Delivery time, "free delivery", pick-up prep time and a missing minimum basket are mocks.
 */
export function FulfillmentToggle({ branchId, options, mode, onModeChange, distanceM, minBasket, currency, symbol, addressText }: Props) {
  const { t } = useTranslation();
  if (options.length === 0) return null;
  const eta = mockDelivery(distanceM);
  const prep = mockPrep(branchId);
  const mockMin = minBasket == null && SHOW_MOCKS;
  const min = minBasket ?? (SHOW_MOCKS ? mockMinBasket(branchId, currency) : null);
  // Without mocks the card may have nothing real to say (no minimum basket, no address); an empty frame is worse than none.
  const hasCard = SHOW_MOCKS || (mode === 'delivery' ? min != null : !!addressText);

  return (
    <View style={styles.wrap}>
      <View style={styles.segment} accessibilityRole="tablist">
        {options.map((option) => {
          const active = option === mode;
          return (
            <Pressable
              key={option}
              onPress={() => onModeChange(option)}
              disabled={options.length === 1}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{t(`restaurant.${option}`)}</Text>
            </Pressable>
          );
        })}
      </View>
      {hasCard ? (
        <View testID="fulfillment-card" style={styles.card}>
          {mode === 'delivery' ? (
            <>
              {SHOW_MOCKS ? (
                <View style={styles.line}>
                  <Bike size={20} color={colors.foreground} />
                  <Text style={styles.strong}>{t('restaurant.deliveryTime', eta)}</Text>
                  <MockTag />
                </View>
            ) : null}
            <View style={styles.line}>
              {SHOW_MOCKS ? (
                <>
                  <Text style={styles.free}>{t('restaurant.freeDelivery')}</Text>
                  <MockTag />
                </>
              ) : null}
              {min != null ? (
                <>
                  {SHOW_MOCKS ? <Text style={styles.dot}>·</Text> : null}
                  <Text style={styles.muted}>{t('restaurant.minOrder', { amount: formatMoney(min, currency, { symbol, whole: true }) })}</Text>
                  {mockMin ? <MockTag /> : null}
                </>
              ) : null}
            </View>
          </>
        ) : (
          <>
            {SHOW_MOCKS ? (
              <View style={styles.line}>
                <Store size={20} color={colors.foreground} />
                <Text style={styles.strong}>{t('restaurant.prep', prep)}</Text>
                <MockTag />
              </View>
            ) : null}
            {addressText ? (
              <Text style={styles.muted} numberOfLines={2}>
                {addressText}
              </Text>
            ) : null}
          </>
        )}
      </View>
      ) : null}
      <View style={styles.note}>
        <Info size={14} color={colors.mutedForeground} />
        <Text style={styles.noteText}>{t(mode === 'delivery' ? 'restaurant.courierNote' : 'restaurant.pickupNote')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, gap: space.sm },
  segment: { alignSelf: 'flex-start', flexDirection: 'row', padding: 3, borderRadius: radius.full, backgroundColor: colors.searchFill },
  option: { paddingHorizontal: space.lg, paddingVertical: 7, borderRadius: radius.full },
  optionActive: { backgroundColor: colors.card },
  optionText: { fontSize: font.body, fontWeight: weight.semibold, color: colors.subtle },
  optionTextActive: { color: colors.foreground },
  card: { gap: 6, padding: space.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  line: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  strong: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  free: { fontSize: font.body, fontWeight: weight.semibold, color: colors.success },
  muted: { fontSize: font.body, color: colors.mutedForeground },
  dot: { fontSize: font.body, color: colors.subtle },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.md, backgroundColor: colors.searchFill },
  noteText: { flex: 1, fontSize: font.small, color: colors.mutedForeground },
});
