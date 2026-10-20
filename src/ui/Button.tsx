import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space, weight } from '@/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  testID?: string;
};

const textColor: Record<Variant, string> = {
  primary: colors.primaryForeground,
  secondary: colors.foreground,
  ghost: colors.primarySoftForeground,
  destructive: colors.primaryForeground,
};

/** One CTA for the whole app; while `loading` it swaps the title for a spinner so double taps cannot fire twice. */
export function Button({ title, onPress, variant = 'primary', loading, disabled, icon, testID }: Props) {
  const inactive = loading || disabled;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.base,
        variantStyle(variant, pressed),
        inactive && styles.inactive,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor[variant]} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: textColor[variant] }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

function variantStyle(variant: Variant, pressed: boolean) {
  switch (variant) {
    case 'primary':
      return { backgroundColor: pressed ? colors.primaryPressed : colors.primary };
    case 'secondary':
      return { backgroundColor: pressed ? colors.primarySoft : colors.card, borderWidth: 1, borderColor: colors.border };
    case 'ghost':
      return { backgroundColor: pressed ? colors.primarySoft : 'transparent' };
    case 'destructive':
      return { backgroundColor: colors.destructive, opacity: pressed ? 0.85 : 1 };
  }
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  label: { fontSize: font.base, fontWeight: weight.semibold },
  inactive: { opacity: 0.5 },
});
