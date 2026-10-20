import { FlatList, StyleSheet } from 'react-native';
import { BranchCard, COMPACT_CARD_WIDTH } from '@/components/BranchCard';
import { space } from '@/theme';
import type { Branch } from '@/types/branch';

type Props = {
  branches: Branch[];
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (branch: Branch) => void;
  cuisineLabelOf: (branch: Branch) => string | undefined;
};

/** Horizontal row of compact restaurant cards. */
export function BranchCarousel({ branches, isFavorite, onToggleFavorite, cuisineLabelOf }: Props) {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={branches}
      keyExtractor={(b) => b.id}
      contentContainerStyle={styles.row}
      snapToInterval={COMPACT_CARD_WIDTH + space.md}
      decelerationRate="fast"
      renderItem={({ item }) => (
        <BranchCard
          branch={item}
          variant="compact"
          isFavorite={isFavorite(item.id)}
          onToggleFavorite={() => onToggleFavorite(item)}
          cuisineLabel={cuisineLabelOf(item)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  // Vertical padding leaves room for the card shadow, which the list would otherwise clip.
  row: { paddingHorizontal: space.lg, paddingVertical: space.xs, paddingBottom: space.md, gap: space.md },
});
