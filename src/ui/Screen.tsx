import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '@/theme';

type Props = { children: ReactNode; scroll?: boolean; padded?: boolean };

/** Cream canvas with the top safe area only; the tab bar / sheets own the bottom inset. */
export function Screen({ children, scroll, padded }: Props) {
  const padding = padded ? styles.padded : undefined;
  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {scroll ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={padding}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, padding]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  padded: { padding: space.lg },
});
