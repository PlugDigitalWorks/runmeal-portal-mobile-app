import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ScrollViewInstance } from 'react-native';
import { colors, space, weight } from '@/theme';

export type MenuTab = { id: string; label: string };
type Props = { tabs: MenuTab[]; selected: string | null; onSelect: (id: string) => void };

/** Underlined text tabs (Uber / Getir): the selected one is bold with a 2 px line; keeps it scrolled into view as the page moves. */
export function MenuTabs({ tabs, selected, onSelect }: Props) {
  const ref = useRef<ScrollViewInstance>(null);
  const tabX = useRef<Record<string, number>>({});
  useEffect(() => {
    const x = selected ? tabX.current[selected] : undefined;
    if (x != null) ref.current?.scrollTo({ x: Math.max(0, x - space.lg), animated: true });
  }, [selected]);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.bar}>
      {tabs.map((tab) => {
        const active = tab.id === selected;
        return (
          <View
            key={tab.id}
            onLayout={(e) => {
              tabX.current[tab.id] = e.nativeEvent.layout.x;
              // A freshly mounted (pinned) row learns the positions late; catch up for the tab that is already selected.
              if (active) ref.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - space.lg), animated: false });
            }}
          >
            <Pressable onPress={() => onSelect(tab.id)} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.tab, active && styles.tabActive]}>
              <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  tabs: { paddingHorizontal: space.lg, gap: space.xl },
  tab: { paddingVertical: space.md, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: colors.foreground },
  label: { fontSize: 15, fontWeight: '500', color: colors.mutedForeground },
  labelActive: { fontWeight: weight.bold, color: colors.foreground },
});
