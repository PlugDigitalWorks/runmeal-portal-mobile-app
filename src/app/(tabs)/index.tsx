import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Heart, MapPinOff } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { AddressSheet } from '@/components/AddressSheet';
import { BranchCard } from '@/components/BranchCard';
import { BranchCarousel } from '@/components/BranchCarousel';
import { CampaignCarousel } from '@/components/CampaignCarousel';
import { ChainStories } from '@/components/ChainStories';
import { CountdownStrip, COUNTDOWN_HEIGHT } from '@/components/CountdownStrip';
import { CuisineTiles } from '@/components/CuisineTiles';
import { HeroBanner } from '@/components/HeroBanner';
import { HomeHeader } from '@/components/HomeHeader';
import { SearchBar } from '@/components/SearchBar';
import { SectionHeader } from '@/components/SectionHeader';
import { SortFilterBar } from '@/components/SortFilterBar';
import { SHOW_MOCKS } from '@/config';
import { NO_FILTERS } from '@/lib/home-filters';
import { useHomeView } from '@/context/HomeViewContext';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { CAMPAIGNS, chainsOf, pickedForYou, topRatedBranches } from '@/mocks/home-mocks';
import { useFavorites } from '@/queries/useFavorites';
import { colors, space } from '@/theme';
import type { Branch } from '@/types/branch';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { BranchCardSkeleton, BranchCarouselSkeleton } from '@/ui/Skeleton';

const NEARBY_LIMIT = 10;

/**
 * Keşfet, laid out like Uber Eats: address, search, sort/filter, then horizontal rows and the full list.
 * Rows above the cuisine tiles (featured, campaigns, for you) show every nearby branch; the ones below
 * follow the sort, filters and cuisine. Sections without real data behind them carry a "(Mock)" label.
 */
export default function Home() {
  const { t } = useTranslation();
  const { branches, visible, categories, active, cuisineOf, refresh, refreshing, refetch, loading, failed } = useHomeFeed();
  const { setCategory, setFilters } = useHomeView();
  const { isFavorite, toggle } = useFavorites();
  const [sheetOpen, setSheetOpen] = useState(false);

  const cuisineLabelOf = (b: Branch) => {
    const id = cuisineOf(b);
    return id ? t(`categories.${id}`) : undefined;
  };
  const carouselProps = { isFavorite, onToggleFavorite: toggle, cuisineLabelOf };
  const ready = !loading && !failed;
  // Above the cuisine tiles, so every nearby chain, not the filtered list.
  const chains = chainsOf(branches);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <FlatList
        data={ready ? visible : []}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View>
            <HomeHeader onOpenAddress={() => setSheetOpen(true)} />
            <SearchBar />
            <SortFilterBar />
            {ready && SHOW_MOCKS && chains.length > 0 ? <ChainStories chains={chains} /> : null}
            {SHOW_MOCKS ? <HeroBanner /> : null}
            {ready && SHOW_MOCKS ? (
              <>
                <SectionHeader title={t('home.campaigns', { count: CAMPAIGNS.length })} mock onSeeAll={() => router.push('/campaigns')} />
                <CampaignCarousel />
                {branches.length > 0 ? (
                  <>
                    <SectionHeader title={t('home.forYou')} mock icon={<Heart size={24} color={colors.destructive} fill={colors.destructive} />} />
                    <BranchCarousel branches={pickedForYou(branches)} {...carouselProps} />
                  </>
                ) : null}
              </>
            ) : null}
            {ready && categories.length > 0 ? (
              <>
                <SectionHeader title={t('home.cuisines')} mock={SHOW_MOCKS} />
                <CuisineTiles categories={categories} selected={active} onSelect={setCategory} />
              </>
            ) : null}
            {ready && visible.length > 0 ? (
              <>
                <SectionHeader title={t('home.nearby')} onSeeAll={() => router.push('/restaurants')} />
                <BranchCarousel branches={visible.slice(0, NEARBY_LIMIT)} {...carouselProps} />
                {SHOW_MOCKS ? (
                  <>
                    <SectionHeader title={t('home.topRated')} mock />
                    <BranchCarousel branches={topRatedBranches(visible)} {...carouselProps} />
                  </>
                ) : null}
                <SectionHeader title={t('home.allRestaurants')} trailing={t('home.branchCount', { count: visible.length })} />
              </>
            ) : null}
            {loading ? (
              <>
                <SectionHeader title={t('home.nearby')} />
                <BranchCarouselSkeleton />
                <SectionHeader title={t('home.allRestaurants')} />
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item} testID="all-restaurants-item">
            <BranchCard branch={item} isFavorite={isFavorite(item.id)} onToggleFavorite={() => toggle(item)} cuisineLabel={cuisineLabelOf(item)} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletons}>
              <BranchCardSkeleton />
              <BranchCardSkeleton />
            </View>
          ) : failed ? (
            <ErrorState onRetry={refetch} />
          ) : branches.length > 0 ? (
            // Something is nearby, the sort/filter/cuisine choice just hides all of it.
            <EmptyState
              icon={<MapPinOff size={32} color={colors.primarySoftForeground} />}
              title={t('filters.noMatchTitle')}
              actionLabel={t('filters.clear')}
              onAction={() => {
                setFilters(NO_FILTERS);
                setCategory(null);
              }}
            />
          ) : (
            <EmptyState
              icon={<MapPinOff size={32} color={colors.primarySoftForeground} />}
              title={t('home.emptyTitle')}
              actionLabel={t('home.changeAddress')}
              onAction={() => setSheetOpen(true)}
            />
          )
        }
      />
      <CountdownStrip />
      <AddressSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  // Room for the countdown strip pinned above the tab bar.
  content: { paddingBottom: space.xxl + COUNTDOWN_HEIGHT },
  item: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  skeletons: { paddingHorizontal: space.lg, gap: space.lg },
});
