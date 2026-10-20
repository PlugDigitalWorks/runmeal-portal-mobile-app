import { CreditCard } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MOCK_CARDS, type MockCard } from '@/mocks/account-mocks';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from '@/ui/Button';

/**
 * Saved cards, all demo data: there is no card vault in the API yet. Only a brand and last four digits
 * are drawn, and there is deliberately no field that takes a real card number.
 */
export default function CardsScreen() {
  const { t } = useTranslation();
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {MOCK_CARDS.map((card) => (
        <CardRow key={card.id} card={card} label={t('account.cards.default')} />
      ))}
      <Button title={t('account.cards.add')} onPress={() => Alert.alert(t('account.cards.addSoon'))} />
    </ScrollView>
  );
}

function CardRow({ card, label }: { card: MockCard; label: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.art, { backgroundColor: card.color }]}>
        <CreditCard size={18} color="#FFFFFF" />
        <Text style={styles.artBrand}>{card.brand}</Text>
      </View>
      <Text style={styles.number}>{`${card.brand} •••• ${card.last4}`}</Text>
      {card.isDefault ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  art: { width: 64, height: 42, borderRadius: 6, padding: 6, justifyContent: 'space-between' },
  artBrand: { fontSize: 9, fontWeight: weight.bold, color: '#FFFFFF' },
  number: { flex: 1, fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  badgeText: { fontSize: font.small, fontWeight: weight.semibold, color: colors.primarySoftForeground },
});
