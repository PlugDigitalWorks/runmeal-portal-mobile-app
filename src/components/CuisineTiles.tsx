import { Beef, Coffee, Egg, Globe, IceCreamCone, Pizza, Salad, Sandwich, type LucideIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PhotoImage } from '@/components/PhotoImage';
import { SHOW_MOCKS } from '@/config';
import type { CategoryId } from '@/lib/categories';
import { CUISINE_PHOTO_SEEDS } from '@/mocks/home-mocks';
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

/** Square cuisine tiles, a (mock) food photo each, or the cuisine icon when mocks are off; tapping the chosen one again clears the choice. Only cuisines some nearby branch matches are listed. */
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
              {SHOW_MOCKS ? (
                <PhotoImage seed={CUISINE_PHOTO_SEEDS[id]} width={240} height={240} style={StyleSheet.absoluteFill} />
              ) : (
                <Icon size={30} color={on ? colors.primary : colors.primarySoftForeground} />
              )}
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
  item: { width: 84, alignItems: 'center', gap: 6 },
  tile: { width: 84, height: 84, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  tileOn: { borderColor: colors.primary },
  label: { fontSize: font.small, fontWeight: weight.semibold, color: colors.foreground },
  labelOn: { color: colors.primarySoftForeground },
});
