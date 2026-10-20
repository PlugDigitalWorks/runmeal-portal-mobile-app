import { router } from 'expo-router';
import { ChevronDown, Crown, Percent } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { CountdownClock } from '@/components/CountdownStrip';
import { DealCard } from '@/components/DealCard';
import { SHOW_MOCKS } from '@/config';
import { useHomeFeed } from '@/hooks/useHomeFeed';
import { isOpenNow } from '@/lib/branch-model';
import { formatMoneyWhole } from '@/lib/money';
import { dealBranches, flashTiers } from '@/mocks/home-mocks';
import { useFavorites } from '@/queries/useFavorites';
import { colors, font, radius, space, weight } from '@/theme';
import type { Branch } from '@/types/branch';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { MockTag } from '@/ui/MockTag';
import { BranchCardSkeleton } from '@/ui/Skeleton';

type Cell = Branch | { id: 'spacer' };

/**
 * "Runmeal Flaş" (mock): a near-full-height bottom sheet over Keşfet, opened by the countdown strip. With
 * mocks off there is no promo data, so the sheet is an empty state and nothing is fetched.
 */
export default function Deals() {
  const { t } = useTranslation();
  if (!SHOW_MOCKS) {
    return (
      <View style={styles.center}>
        <EmptyState icon={<Percent size={32} color={colors.primarySoftForeground} />} title={t('deals.notFound')} />
      </View>
    );
  }
  return <DealsSheet />;
}

/** The orange panel: title art, four discount tiers, the live countdown. It runs edge to edge under the sheet's rounded top. */
function FlashHeader({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const tiers = flashTiers(currency);
  return (
    <View style={styles.panel}>
      <Pressable style={styles.minimize} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('deals.minimize')}>
        <Text style={styles.minimizeText}>{t('deals.minimize')}</Text>
        <View style={styles.minimizeIcon}>
          <ChevronDown size={14} color={colors.primaryForeground} />
        </View>
      </Pressable>
      <View style={styles.art}>
        <Text style={styles.title} adjustsFontSizeToFit numberOfLines={1} accessibilityRole="header">
          {t('deals.brand')}
        </Text>
      </View>
      <View style={styles.tiers}>
        {tiers.map((tier, i) => {
          const top = i === tiers.length - 1;
          return (
            <View key={tier.min} style={styles.tier}>
              <View style={styles.tierTab}>
                <Text style={styles.tierTabText} numberOfLines={2}>
                  {t('deals.tierMin', { amount: formatMoneyWhole(tier.min, currency) })}
                </Text>
              </View>
              <View style={[styles.tierCard, top && styles.tierCardTop]}>
                <Text style={[styles.tierAmount, top && styles.tierTextTop]} adjustsFontSizeToFit minimumFontScale={0.75} numberOfLines={1}>
                  {formatMoneyWhole(tier.off, currency)}
                </Text>
                <Text style={[styles.tierOff, top && styles.tierTextTop]}>{t('deals.tierOff')}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <Text style={styles.disclaimer}>{t('deals.disclaimer')}</Text>
      <View style={styles.countdown}>
        <CountdownClock />
        <Text style={styles.countdownText}>{t('countdown.text')}</Text>
      </View>
      <View style={styles.tag}>
        <MockTag />
      </View>
    </View>
  );
}

function DealsSheet() {
  const { t } = useTranslation();
  const { branches, cuisineOf, loading, failed, refetch } = useHomeFeed();
  const { isFavorite, toggle } = useFavorites();
  // Closed branches are left out; the list is the nearby ones that carry promos, most promos first.
  const deals = useMemo(() => dealBranches(branches.filter((b) => isOpenNow(b.business_hour))), [branches]);
  // Two columns: an odd last tile gets an empty neighbour so it keeps the column width.
  const cells: Cell[] = useMemo(() => (deals.length % 2 ? [...deals, { id: 'spacer' }] : deals), [deals]);
  const currency = branches[0]?.currency ?? 'TRY';
  // The sheet closes as the restaurant opens: replacing it leaves Keşfet underneath and back returns there.
  const open = (branch: Branch) => router.replace({ pathname: '/restaurant/[branchId]', params: { branchId: branch.id } });

  return (
    <FlatList
      style={styles.root}
      data={loading || failed ? [] : cells}
      numColumns={2}
      keyExtractor={(b) => b.id}
      columnWrapperStyle={styles.columns}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View>
          <FlashHeader currency={currency} />
          <View style={styles.sectionRow}>
            <Crown size={22} color={colors.foreground} />
            <Text style={styles.section} numberOfLines={2} accessibilityRole="header">
              {`${t('deals.featured', { count: deals.length })} (${t('common.mock')})`}
            </Text>
            <View style={styles.sponsored}>
              <Text style={styles.sponsoredText}>{t('home.sponsored')}</Text>
            </View>
          </View>
        </View>
      }
      renderItem={({ item }) => {
        if (!('name' in item)) return <View style={styles.spacer} />;
        const cuisine = cuisineOf(item);
        return (
          <View style={styles.cell}>
            <DealCard branch={item} isFavorite={isFavorite(item.id)} onToggleFavorite={() => toggle(item)} cuisineLabel={cuisine ? t(`categories.${cuisine}`) : undefined} onOpen={() => open(item)} />
          </View>
        );
      }}
      ListEmptyComponent={
        loading ? (
          <View style={styles.skeletons}>
            <BranchCardSkeleton />
          </View>
        ) : failed ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <EmptyState icon={<Percent size={32} color={colors.primarySoftForeground} />} title={t('deals.emptyTitle')} />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  content: { paddingBottom: space.xxl },
  columns: { gap: space.md, paddingHorizontal: space.lg },
  cell: { flex: 1, paddingBottom: space.md },
  spacer: { flex: 1 },
  skeletons: { paddingHorizontal: space.lg },
  panel: { backgroundColor: colors.primary, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.lg, gap: space.md },
  minimize: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingLeft: space.md, paddingRight: 4, borderRadius: radius.full, backgroundColor: colors.card },
  minimizeText: { fontSize: font.body, fontWeight: weight.bold, color: colors.foreground },
  minimizeIcon: { width: 24, height: 24, borderRadius: radius.full, backgroundColor: colors.foreground, alignItems: 'center', justifyContent: 'center' },
  art: { alignItems: 'center', marginTop: -space.lg },
  title: { fontSize: 68, lineHeight: 76, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1, color: colors.primaryForeground, textShadowColor: colors.foreground, textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0 },
  tiers: { flexDirection: 'row', gap: space.sm },
  tier: { flex: 1, alignItems: 'center' },
  tierTab: { zIndex: 1, minHeight: 30, paddingHorizontal: 6, paddingVertical: 3, borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm, backgroundColor: colors.foreground, alignItems: 'center', justifyContent: 'center' },
  tierTabText: { fontSize: 9, lineHeight: 11, fontWeight: weight.bold, textAlign: 'center', color: colors.primaryForeground },
  tierCard: { alignSelf: 'stretch', marginTop: -2, height: 64, justifyContent: 'center', paddingVertical: space.sm, paddingHorizontal: 4, borderRadius: radius.md, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.card, alignItems: 'center' },
  tierCardTop: { backgroundColor: colors.promo },
  tierAmount: { fontSize: 19, fontWeight: '900', color: colors.foreground },
  tierOff: { fontSize: 11, fontWeight: '900', color: colors.foreground },
  tierTextTop: { color: colors.primaryForeground },
  disclaimer: { fontSize: 9, lineHeight: 12, textAlign: 'center', color: colors.foreground, opacity: 0.8 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  countdownText: { flex: 1, fontSize: font.base, lineHeight: 21, fontWeight: weight.semibold, color: colors.primaryForeground },
  tag: { position: 'absolute', left: space.lg, top: space.lg },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.xl, paddingBottom: space.md },
  section: { flexShrink: 1, fontSize: 17, fontWeight: weight.bold, color: colors.foreground },
  sponsored: { marginLeft: 'auto', paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.searchFill },
  sponsoredText: { fontSize: font.caption, fontWeight: weight.semibold, color: colors.mutedForeground },
});
