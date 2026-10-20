import { Percent } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { BranchCard } from '@/components/BranchCard';
import { CountdownClock } from '@/components/CountdownStrip';
import { SHOW_MOCKS } from '@/config';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { isOpenNow } from '@/lib/branch-model';
import { dealBranches } from '@/mocks/home-mocks';
import { useFavorites } from '@/queries/useFavorites';
import { colors, radius, space } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { MockTag } from '@/ui/MockTag';
import { BranchCardSkeleton } from '@/ui/Skeleton';

/**
 * "Fırsatlar": where the countdown strip leads (mock). A header card with the same live countdown, then the
 * open nearby restaurants that carry promo strips, most strips first. Closed ones are left out: their cards
 * do not show strips. With mocks off there is no promo data, so the route is an empty state.
 */
export default function Deals() {
  const { t } = useTranslation();
  const { branches, cuisineOf, loading, failed, refetch } = useHomeFeed();
  const { isFavorite, toggle } = useFavorites();

  if (!SHOW_MOCKS) {
    return (
      <View style={styles.center}>
        <EmptyState icon={<Percent size={32} color={colors.primarySoftForeground} />} title={t('deals.notFound')} />
      </View>
    );
  }
  const deals = dealBranches(branches.filter((b) => isOpenNow(b.business_hour)));

  return (
    <View style={styles.root}>
      <FlatList
        data={loading || failed ? [] : deals}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <CountdownClock />
            <Text style={styles.headerText}>{t('countdown.text')}</Text>
            <View style={styles.tag}>
              <MockTag />
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const cuisine = cuisineOf(item);
          return (
            <View style={styles.item}>
              <BranchCard branch={item} isFavorite={isFavorite(item.id)} onToggleFavorite={() => toggle(item)} cuisineLabel={cuisine ? t(`categories.${cuisine}`) : undefined} />
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
            <EmptyState icon={<Percent size={32} color={colors.primarySoftForeground} />} title={t('deals.emptyTitle')} />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: space.lg, paddingBottom: space.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, marginBottom: space.lg, borderRadius: radius.lg, backgroundColor: colors.primary },
  headerText: { flex: 1, fontSize: 16, lineHeight: 21, fontWeight: '700', color: colors.primaryForeground },
  tag: { position: 'absolute', right: space.md, top: -9 },
  item: { paddingBottom: space.lg },
  skeletons: { gap: space.lg },
});
