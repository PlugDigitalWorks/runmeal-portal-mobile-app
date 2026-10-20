import { Beef, Coffee, Egg, Globe, IceCreamCone, Pizza, Salad, Sandwich, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CategoryId } from '@/lib/categories';
import { colors, font, radius, space, weight } from '@/theme';

const ICONS: Record<CategoryId, LucideIcon> = {
  coffee: Coffee,
  pizza: Pizza,
  burger: Sandwich,
  kebab: Beef,
  dessert: IceCreamCone,
  breakfast: Egg,
  healthy: Salad,
  world: Globe,
};

type Props = { categories: CategoryId[]; selected: CategoryId | null; onSelect: (category: CategoryId | null) => void };

/** Square cuisine tiles; tapping the chosen one again clears the choice. Only cuisines some nearby branch matches are listed. */
export function CuisineTiles({ categories, selected, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {categories.map((id) => {
        const Icon = ICONS[id];
        const on = selected === id;
        return (
          <Pressable key={id} onPress={() => onSelect(on ? null : id)} style={styles.item} accessibilityRole="button" accessibilityState={{ selected: on }}>
            <View style={[styles.tile, on && styles.tileOn]}>
              <Icon size={30} color={on ? colors.primary : colors.primarySoftForeground} />
            </View>
            <Text style={[styles.label, on && styles.labelOn]} numberOfLines={1}>
              {t(`categories.${id}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.lg, gap: space.md },
  item: { width: 76, alignItems: 'center', gap: 6 },
  tile: { width: 76, height: 76, borderRadius: radius.lg, backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  tileOn: { borderColor: colors.primary },
  label: { fontSize: font.small, fontWeight: weight.semibold, color: colors.foreground },
  labelOn: { color: colors.primarySoftForeground },
});
