import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, radius, space, weight } from '@/theme';

type Props = { label: string; selected?: boolean; onPress: () => void; icon?: ReactNode };

/** Category pill: dark when selected, soft orange otherwise, so the active filter reads at a glance. */
export function Chip({ label, selected, onPress, icon }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[styles.chip, selected ? styles.selected : styles.idle]}
    >
      {icon}
      <Text
        numberOfLines={1}
        style={[styles.label, { color: selected ? colors.primaryForeground : colors.primarySoftForeground }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.full,
  },
  selected: { backgroundColor: colors.foreground },
  idle: { backgroundColor: colors.primarySoft },
  label: { fontSize: font.body, fontWeight: weight.semibold },
});
