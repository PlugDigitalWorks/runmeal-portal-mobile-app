import { MapPinOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { BranchCard } from '@/components/BranchCard';
import { CategoryChips } from '@/components/CategoryChips';
import { SortFilterBar } from '@/components/SortFilterBar';
import { useHomeView } from '@/context/HomeViewContext';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { NO_FILTERS } from '@/lib/home-filters';
import { useFavorites } from '@/queries/useFavorites';
import { colors, space } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { BranchCardSkeleton } from '@/ui/Skeleton';

/** "See all": every nearby restaurant as full cards, with the same sort, filters and cuisine as Keşfet. */
export default function Restaurants() {
  const { t } = useTranslation();
  const { branches, visible, categories, active, cuisineOf, refresh, refreshing, refetch, loading, failed } = useHomeFeed();
  const { setCategory, setFilters } = useHomeView();
  const { isFavorite, toggle } = useFavorites();
  const ready = !loading && !failed;

  return (
    <View style={styles.root}>
      <FlatList
        data={ready ? visible : []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View>
            <SortFilterBar />
            {ready && categories.length > 0 ? <CategoryChips categories={categories} selected={active} onSelect={setCategory} /> : null}
          </View>
        }
        renderItem={({ item }) => {
          const cuisine = cuisineOf(item);
          return (
            <View style={styles.item}>
              <BranchCard
                branch={item}
                isFavorite={isFavorite(item.id)}
                onToggleFavorite={() => toggle(item)}
                cuisineLabel={cuisine ? t(`categories.${cuisine}`) : undefined}
              />
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletons}>
              <BranchCardSkeleton />
              <BranchCardSkeleton />
            </View>
          ) : failed ? (
            <ErrorState onRetry={refetch} />
          ) : (
            <EmptyState
              icon={<MapPinOff size={32} color={colors.primarySoftForeground} />}
              title={branches.length > 0 ? t('filters.noMatchTitle') : t('home.emptyTitle')}
              actionLabel={branches.length > 0 ? t('filters.clear') : undefined}
              onAction={
                branches.length > 0
                  ? () => {
                      setFilters(NO_FILTERS);
                      setCategory(null);
                    }
                  : undefined
              }
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: space.xxl },
  item: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  skeletons: { paddingHorizontal: space.lg, gap: space.lg },
});
