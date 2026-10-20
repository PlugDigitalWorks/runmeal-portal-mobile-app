import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import type { CategoryId } from '@/lib/categories';
import { space } from '@/theme';
import { Chip } from '@/ui/Chip';

type Props = { categories: CategoryId[]; selected: CategoryId | null; onSelect: (category: CategoryId | null) => void };

/** "All" plus only the cuisines some nearby branch actually matches, so no chip leads to an empty list. */
export function CategoryChips({ categories, selected, onSelect }: Props) {
  const { t } = useTranslation();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Chip label={t('categories.all')} selected={selected === null} onPress={() => onSelect(null)} />
      {categories.map((id) => (
        <Chip key={id} label={t(`categories.${id}`)} selected={selected === id} onPress={() => onSelect(id)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm },
});
