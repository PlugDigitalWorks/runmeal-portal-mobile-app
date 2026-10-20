import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, weight } from '@/theme';

type Props<T extends string> = { options: { value: T; label: string }[]; value: T | null; onChange: (value: T) => void };

/** The restaurant page's pill switch, stretched to the card: one option reads as a label, several as tabs. */
export function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.segment} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={options.length === 1}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', padding: 3, borderRadius: radius.full, backgroundColor: colors.searchFill },
  option: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.full },
  optionActive: { backgroundColor: colors.card },
  text: { fontSize: font.body, fontWeight: weight.semibold, color: colors.subtle },
  textActive: { color: colors.foreground },
});
