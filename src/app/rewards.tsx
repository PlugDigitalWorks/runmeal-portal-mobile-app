import { useQueries, useQuery } from '@tanstack/react-query';
import { Gift } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StampStrip } from '@/components/StampStrip';
import { passState, resolveStampProgress, sortCardsByProgress } from '@/lib/loyalty';
import { qk } from '@/queries/keys';
import { getStampCards } from '@/services/loyalty.service';
import { getMyOrders } from '@/services/order.service';
import type { StampCard } from '@/types/loyalty';
import { colors, font, radius, space, weight } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';

/**
 * The stamp cards of every brand the person has ordered from (GET /orders/customer gives the brand ids,
 * GET /loyalty/stamps/me/:brandId the cards), drawn with the pass's stamp strip. No Wallet buttons or member QR here.
 */
export default function RewardsScreen() {
  const { t } = useTranslation();
  const orders = useQuery({ queryKey: qk.orders, queryFn: getMyOrders });
  const brandIds = useMemo(() => [...new Set((orders.data ?? []).map((order) => order.brandId).filter(Boolean))], [orders.data]);
  const stamps = useQueries({ queries: brandIds.map((brandId) => ({ queryKey: qk.stamps(brandId), queryFn: () => getStampCards(brandId) })) });

  const loading = orders.isLoading || stamps.some((query) => query.isLoading);
  const failed = orders.isError || (stamps.length > 0 && stamps.every((query) => query.isError));
  const cards = useMemo(() => sortCardsByProgress(stamps.flatMap((query) => query.data ?? [])), [stamps]);
  const refetch = () => {
    void orders.refetch();
    stamps.forEach((query) => void query.refetch());
  };

  if (loading) {
    return (
      <View style={styles.content}>
        <Skeleton height={180} radius={radius.lg} />
        <Skeleton height={180} radius={radius.lg} />
      </View>
    );
  }
  if (failed) return <ErrorState message={t('rewards.loadFailed')} onRetry={refetch} />;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={refetch} />}
    >
      {cards.length === 0 ? (
        <EmptyState icon={<Gift size={32} color={colors.primarySoftForeground} />} title={t('rewards.emptyTitle')} body={t('rewards.emptyBody')} />
      ) : (
        cards.map((card) => <StampCardView key={card.campaignId} card={card} />)
      )}
    </ScrollView>
  );
}

function StampCardView({ card }: { card: StampCard }) {
  const { t } = useTranslation();
  const { earned, target, remaining } = resolveStampProgress(card);
  const state = passState(card);
  const status = state === 'ready' ? t('rewards.ready') : state === 'paused' ? t('rewards.paused') : t('rewards.remaining', { count: remaining });
  return (
    <View style={styles.card} testID={`stamp-card-${card.campaignId}`}>
      <StampStrip count={earned} threshold={target} state={state} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {card.campaignName}
          </Text>
          <Text style={styles.count}>{t('rewards.stamps', { earned, target })}</Text>
        </View>
        <Text style={[styles.status, state === 'ready' && styles.statusReady]}>{status}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg },
  card: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  info: { padding: space.lg, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md },
  name: { flex: 1, fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  count: { fontSize: font.body, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  status: { fontSize: font.body, color: colors.mutedForeground },
  statusReady: { fontWeight: weight.semibold, color: colors.success },
});
