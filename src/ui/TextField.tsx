import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, font, radius, space, weight } from '@/theme';

type Props = TextInputProps & { label: string; value: string; onChangeText: (text: string) => void; error?: string };

/** Labelled input; the label doubles as the accessibility label so screen readers and tests can find it. */
export function TextField({ label, error, style, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.subtle}
        {...inputProps}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: font.small, fontWeight: weight.semibold, color: colors.mutedForeground },
  input: {
    height: 48,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    fontSize: font.base,
    color: colors.foreground,
  },
  inputError: { borderColor: colors.destructive },
  error: { fontSize: font.small, color: colors.destructive },
});
