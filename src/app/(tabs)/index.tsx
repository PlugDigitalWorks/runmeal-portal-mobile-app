import { useQueryClient } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { MapPinOff } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { AddressSheet } from '@/components/AddressSheet';
import { BranchCard } from '@/components/BranchCard';
import { CategoryChips } from '@/components/CategoryChips';
import { HomeHeader } from '@/components/HomeHeader';
import { useLocation } from '@/context/LocationContext';
import { availableCategories, branchMatchesCategory, menuText, type CategoryId } from '@/lib/categories';
import { useFavorites } from '@/queries/useFavorites';
import { qk } from '@/queries/keys';
import { useNearbyBranches } from '@/queries/useNearbyBranches';
import { colors, font, space, weight } from '@/theme';
import type { Menu } from '@/types/product';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { BranchCardSkeleton } from '@/ui/Skeleton';

/** Discovery feed: restaurants that deliver to the active address, filterable by cuisine chip. */
export default function Home() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { isLoading: locating } = useLocation();
  const { data, isLoading, isError, refetch } = useNearbyBranches();
  const { isFavorite, toggle } = useFavorites();
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const branches = useMemo(() => data ?? [], [data]);
  // Menus are only known for restaurants the person already opened; their text sharpens the match.
  const menuTexts = useMemo(() => {
    const texts: Record<string, string> = {};
    for (const b of branches) {
      const menu = queryClient.getQueryData<Menu>(qk.menu(b.id));
      if (menu) texts[b.id] = menuText(menu);
    }
    return texts;
  }, [branches, queryClient]);
  const categories = useMemo(() => availableCategories(branches, menuTexts), [branches, menuTexts]);
  // A change of address can drop the chosen cuisine from the list; fall back to "All" rather than show nothing.
  const active = category && categories.includes(category) ? category : null;
  const visible = active ? branches.filter((b) => branchMatchesCategory(b, active, menuTexts[b.id])) : branches;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const loading = locating || isLoading;
  // A failed refresh keeps the list already on screen; the error view is only for when there is nothing to show.
  const failed = isError && !data;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <FlatList
        data={loading || failed ? [] : visible}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          <View>
            <HomeHeader onOpenAddress={() => setSheetOpen(true)} />
            <CategoryChips categories={categories} selected={active} onSelect={setCategory} />
            <View style={styles.titleRow}>
              <Text style={styles.title}>{t('home.nearby')}</Text>
              {!loading && !failed ? <Text style={styles.count}>{t('home.branchCount', { count: visible.length })}</Text> : null}
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <BranchCard branch={item} isFavorite={isFavorite(item.id)} onToggleFavorite={() => toggle(item)} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletons}>
              <BranchCardSkeleton />
              <BranchCardSkeleton />
              <BranchCardSkeleton />
            </View>
          ) : failed ? (
            <ErrorState onRetry={refetch} />
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
      <AddressSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: space.xxl },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.md },
  title: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  count: { fontSize: font.small, color: colors.mutedForeground },
  item: { paddingHorizontal: space.lg, paddingBottom: space.lg },
  skeletons: { paddingHorizontal: space.lg, gap: space.lg },
});
