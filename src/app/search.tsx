import { router } from 'expo-router';
import { ArrowLeft, Search, SearchX, X } from 'lucide-react-native';
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductRow } from '@/components/ProductRow';
import { SearchBranchRow } from '@/components/SearchBranchRow';
import { SHOW_MOCKS } from '@/config';
import { CATEGORY_IDS, type CategoryId } from '@/lib/categories';
import { clearRecent, loadRecent, pushRecent } from '@/lib/recent-searches';
import { MIN_QUERY, searchBranches, searchProducts, type ProductHit } from '@/lib/search';
import { foldText } from '@/lib/text';
import { useSearchIndex } from '@/queries/useSearchIndex';
import { colors, font, radius, space, weight } from '@/theme';
import type { Branch } from '@/types/branch';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';

/** Demo suggestions: the API has no trending searches (docs/BACKEND_REQUESTS.md), so the row is labelled "(Mock)". */
const POPULAR: CategoryId[] = ['pizza', 'burger', 'coffee', 'dessert'];

type Row = { kind: 'branch'; branch: Branch } | { kind: 'product'; hit: ProductHit };
type Section = { key: 'branches' | 'products'; data: Row[] };

/**
 * Search, opened from the Keşfet pill: back button and an autofocused input on the cream header, then either
 * recent searches / suggestions (query too short) or restaurants and dishes from the nearby menus, matched on
 * the device. Menus load a few at a time, so the dishes section shows a spinner until the scan is done.
 */
export default function SearchScreen() {
  const { t } = useTranslation();
  const { branches, menus, loadingMenus } = useSearchIndex();
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  // The deferred value lets typing render first and the (heavier) result list catch up; it is not a timed debounce.
  const deferred = useDeferredValue(query);
  const trimmed = deferred.trim();
  const active = trimmed.length >= MIN_QUERY;

  useEffect(() => {
    loadRecent().then(setRecent);
  }, []);

  /** Only searches that can match something are worth coming back to. */
  const remember = useCallback((q: string) => {
    if (foldText(q.trim()).length < MIN_QUERY) return;
    pushRecent(q).then(setRecent);
  }, []);
  /** Chips write a term the keyword matcher finds ("kebap"), not their label ("Döner & Kebap"). */
  const searchCuisine = (id: CategoryId) => setQuery(t(`search.cuisineQuery.${id}`));

  const sections = useMemo<Section[]>(() => {
    if (!active) return [];
    const restaurants = searchBranches(trimmed, branches);
    const dishes = searchProducts(trimmed, branches, menus);
    return [
      { key: 'branches' as const, data: restaurants.map((branch) => ({ kind: 'branch' as const, branch })) },
      { key: 'products' as const, data: dishes.map((hit) => ({ kind: 'product' as const, hit })) },
    ].filter((s) => s.data.length > 0 || (s.key === 'products' && loadingMenus));
  }, [active, trimmed, branches, menus, loadingMenus]);

  const openBranch = (branch: Branch) => {
    remember(trimmed);
    router.push({ pathname: '/restaurant/[branchId]', params: { branchId: branch.id } });
  };
  const openProduct = ({ branch, product, brandId }: ProductHit) => {
    remember(trimmed);
    router.push({ pathname: '/restaurant/[branchId]', params: { branchId: branch.id } });
    router.push({ pathname: '/product/[id]', params: { id: product.id, branchId: branch.id, brandId } });
  };
  const clearHistory = () => {
    setRecent([]);
    clearRecent();
  };

  const suggestions = (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.suggestions}>
      {recent.length > 0 ? (
        <View style={styles.group}>
          <View style={styles.groupHead}>
            <Text style={styles.groupTitle}>{t('search.recent')}</Text>
            <Pressable onPress={clearHistory} hitSlop={8} accessibilityRole="button">
              <Text style={styles.clear}>{t('search.clearRecent')}</Text>
            </Pressable>
          </View>
          <View style={styles.chips}>
            {recent.map((q) => (
              <Chip key={q} label={q} onPress={() => setQuery(q)} />
            ))}
          </View>
        </View>
      ) : null}
      {SHOW_MOCKS ? (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>{t('search.popular')}</Text>
          <View style={styles.chips}>
            {POPULAR.map((id) => (
              <Chip key={id} label={t(`categories.${id}`)} onPress={() => searchCuisine(id)} />
            ))}
          </View>
        </View>
      ) : null}
      {recent.length === 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>{t('search.cuisines')}</Text>
          <View style={styles.chips}>
            {CATEGORY_IDS.map((id) => (
              <Chip key={id} label={t(`categories.${id}`)} onPress={() => searchCuisine(id)} />
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.back} accessibilityRole="button" accessibilityLabel={t('search.back')}>
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.field}>
          <Search size={18} color={colors.subtle} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => remember(query)}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.subtle}
            accessibilityLabel={t('search.placeholder')}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('search.clear')}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!active ? (
        suggestions
      ) : (
        <SectionList<Row, Section>
          sections={sections}
          keyExtractor={(row) => (row.kind === 'branch' ? `b:${row.branch.id}` : `p:${row.hit.branch.id}:${row.hit.product.id}`)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.results}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{t(section.key === 'branches' ? 'search.restaurants' : 'search.products')}</Text>
              {section.key === 'products' && loadingMenus ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>{t('search.loadingMenus')}</Text>
                </View>
              ) : null}
            </View>
          )}
          renderItem={({ item }) =>
            item.kind === 'branch' ? (
              <SearchBranchRow branch={item.branch} onPress={() => openBranch(item.branch)} />
            ) : (
              <ProductRow product={item.hit.product} caption={item.hit.branch.name} onPress={() => openProduct(item.hit)} />
            )
          }
          ListEmptyComponent={
            <EmptyState icon={<SearchX size={32} color={colors.primarySoftForeground} />} title={t('search.noResults', { q: trimmed })} body={t('search.noResultsBody')} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: space.md, paddingRight: space.lg, paddingVertical: space.sm },
  back: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  field: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, borderRadius: radius.full, backgroundColor: colors.searchFill },
  input: { flex: 1, height: 44, fontSize: font.base, color: colors.foreground },
  suggestions: { paddingTop: space.md, paddingBottom: space.xxl, gap: space.xl },
  group: { gap: space.md, paddingHorizontal: space.lg },
  groupHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  groupTitle: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  clear: { fontSize: font.body, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  results: { paddingBottom: space.xxl },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xs, backgroundColor: colors.background },
  sectionTitle: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  loadingText: { fontSize: font.small, color: colors.mutedForeground },
});
