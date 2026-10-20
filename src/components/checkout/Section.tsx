import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space, weight } from '@/theme';

/** White card with an optional 18/700 title: the unit every checkout step is built from. */
export function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? (
        <Text accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  title: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
});
