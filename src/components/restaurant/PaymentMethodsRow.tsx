import { Banknote, CreditCard } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PaymentMethod } from '@/lib/branch-model';
import { colors, font, radius, space, weight } from '@/theme';

/** Online card and card on delivery share the card glyph; only cash gets its own. */
const ICON = { ONLINE_CARD: CreditCard, CARD_ON_DELIVERY: CreditCard, CASH: Banknote } as const;

/** Horizontal pills of the payment methods the branch really accepts (from its payment settings). */
export function PaymentMethodsRow({ methods }: { methods: PaymentMethod[] }) {
  const { t } = useTranslation();
  if (methods.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {methods.map((method) => {
        const Icon = ICON[method];
        return (
          <View key={method} style={styles.pill}>
            <Icon size={16} color={colors.mutedForeground} />
            <Text style={styles.label}>{t(`restaurant.payment.${method}`)}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.lg, gap: space.sm },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: space.md, paddingVertical: space.sm, borderRadius: radius.full, backgroundColor: colors.searchFill },
  label: { fontSize: font.small, fontWeight: weight.semibold, color: colors.foreground },
});
