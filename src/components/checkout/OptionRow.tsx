import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space, weight } from '@/theme';

type Props = { label: string; selected: boolean; onPress: () => void };

/** Radio row for the payment methods. */
export function OptionRow({ label, selected, onPress }: Props) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={[styles.row, selected && styles.rowOn]}>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.dot} /> : null}</View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  rowOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryForeground },
  label: { flex: 1, fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
});
