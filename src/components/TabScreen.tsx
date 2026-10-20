import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, space, weight } from '@/theme';
import { Screen } from '@/ui/Screen';

/** Frame of the tabs that have no navigation header: safe-area top, a large title, then the content. */
export function TabScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Screen>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.body}>{children}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.md, fontSize: font.display, fontWeight: weight.bold, color: colors.foreground },
  body: { flex: 1 },
});
