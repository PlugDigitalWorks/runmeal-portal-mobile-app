import { ChevronRight, RotateCcw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { formatMoney } from '@/lib/money';
import { formatOrderDate } from '@/lib/order-display';
import { useBranch } from '@/queries/useBranch';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import type { Order } from '@/types/order';
import { StatusPill } from './StatusPill';

type Props = { order: Order; onPress: () => void };

/** One order in the list: restaurant, number and date, status and total. The branch name is looked up (the order row carries only ids); the query is shared across rows of a branch. */
export function OrderRow({ order, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const { data: branch } = useBranch(order.branchId);
  const date = formatOrderDate(order.createdAt, i18n.language === 'tr' ? 'tr' : 'en');
  return (
    <View style={styles.card}>
      <Pressable testID={`order-row-${order.id}`} onPress={onPress} accessibilityRole="button" style={styles.main}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {branch?.name ?? t('orders.number', { number: order.orderNumber })}
          </Text>
          <ChevronRight size={18} color={colors.subtle} />
        </View>
        <Text style={styles.meta}>{[branch ? `#${order.orderNumber}` : null, date].filter(Boolean).join(' · ')}</Text>
        <View style={styles.bottom}>
          <StatusPill status={order.status} />
          <Text style={styles.total}>{formatMoney(order.totalPrice, order.currency ?? 'TRY', { symbol: order.currencySymbol })}</Text>
        </View>
      </Pressable>
      {SHOW_MOCKS ? (
        <Pressable onPress={() => Alert.alert(t('orders.reorderSoon'))} accessibilityRole="button" style={styles.reorder}>
          <RotateCcw size={14} color={colors.primarySoftForeground} />
          <Text style={styles.reorderText}>{t('orders.reorder')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  main: { padding: space.lg, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.sm },
  name: { flex: 1, fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  meta: { fontSize: font.body, color: colors.mutedForeground },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  total: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  reorder: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  reorderText: { fontSize: font.body, fontWeight: weight.semibold, color: colors.primarySoftForeground },
});
