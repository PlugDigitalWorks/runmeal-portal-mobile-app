import { Minus, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space, weight } from '@/theme';

type Props = { value: number; onChange: (next: number) => void; min?: number; max?: number };

/** Soft-orange track with white square buttons; clamps to [min, max] so callers never see out-of-range values. */
export function QuantityStepper({ value, onChange, min = 1, max = 99 }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.track}>
      <Pressable
        style={styles.button}
        onPress={() => onChange(Math.max(min, value - 1))}
        accessibilityRole="button"
        accessibilityLabel={t('common.decrease')}
      >
        <Minus size={16} color={colors.foreground} />
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable
        style={styles.button}
        onPress={() => onChange(Math.min(max, value + 1))}
        accessibilityRole="button"
        accessibilityLabel={t('common.increase')}
      >
        <Plus size={16} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 6,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 20, textAlign: 'center', fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
});
