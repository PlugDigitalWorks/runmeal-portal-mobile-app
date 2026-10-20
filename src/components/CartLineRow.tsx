import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { CartLine } from '@/lib/cart-model';
import { formatMoney } from '@/lib/money';
import { colors, font, radius, space, weight } from '@/theme';
import { QuantityStepper } from '@/ui/QuantityStepper';

type Props = { line: CartLine; currency: string; busy?: boolean; onQty: (qty: number) => void };

/** One cart line: photo, name, chosen options, note, a stepper that can go down to zero (which removes the line) and the line price. */
export function CartLineRow({ line, currency, busy, onQty }: Props) {
  const { t } = useTranslation();
  return (
    <View style={[styles.row, busy && styles.busy]} pointerEvents={busy ? 'none' : 'auto'}>
      <View style={styles.thumb}>{line.imageUrl ? <Image source={{ uri: line.imageUrl }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}</View>
      <View style={styles.body}>
        <Text style={styles.name}>{line.name}</Text>
        {line.optionsText ? <Text style={styles.meta}>{line.optionsText}</Text> : null}
        {line.note ? <Text style={styles.meta}>{t('cart.note', { note: line.note })}</Text> : null}
        <View style={styles.bottom}>
          <QuantityStepper value={line.qty} min={0} onChange={onQty} />
          <Text style={styles.price}>{formatMoney(line.lineTotal, currency)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingVertical: 14 },
  busy: { opacity: 0.5 },
  thumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.bannerPlaceholder, overflow: 'hidden' },
  body: { flex: 1, gap: 4 },
  name: { fontSize: font.base - 1, fontWeight: weight.bold, color: colors.foreground },
  meta: { fontSize: font.small, color: colors.mutedForeground },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: font.body + 1, fontWeight: weight.bold, color: colors.foreground },
});
