import { StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '@/lib/money';
import { colors, font, space, weight } from '@/theme';

type Size = 'sm' | 'md' | 'lg';
type Props = { value: number | string | null | undefined; currency: string; original?: number | null; size?: Size };

const valueSize: Record<Size, number> = { sm: font.body, md: font.base, lg: font.heading };
const originalSize: Record<Size, number> = { sm: font.small, md: font.body, lg: font.base };

/** Price with an optional struck-through original, shown only when it is actually higher (a real discount). */
export function Price({ value, currency, original, size = 'md' }: Props) {
  const discounted = original != null && original > Number(value ?? 0);
  return (
    <View style={styles.row}>
      <Text style={[styles.value, { fontSize: valueSize[size] }]}>{formatMoney(value, currency)}</Text>
      {discounted ? (
        <Text style={[styles.original, { fontSize: originalSize[size] }]}>{formatMoney(original, currency)}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm },
  value: { fontWeight: weight.bold, color: colors.foreground },
  original: { color: colors.subtle, textDecorationLine: 'line-through' },
});
