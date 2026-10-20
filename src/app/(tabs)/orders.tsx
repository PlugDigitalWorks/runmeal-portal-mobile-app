import { UtensilsCrossed } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { OrderRow } from '@/components/OrderRow';
import { TabScreen } from '@/components/TabScreen';
import { isActiveOrder } from '@/lib/order-status';
import { useOrders } from '@/queries/useOrders';
import { colors, font, space, weight } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';
import type { Order } from '@/types/order';

/** Order history in two sections, open orders first; pull to refresh. The API lists newest first. */
export default function Orders() {
  const { t } = useTranslation();
  const { data, isLoading, isError, isRefetching, refetch } = useOrders();
  const sections = useMemo(() => {
    const orders = data ?? [];
    const active = orders.filter((order) => isActiveOrder(order.status));
    const past = orders.filter((order) => !isActiveOrder(order.status));
    return [
      { key: 'active', title: t('orders.active'), data: active },
      { key: 'past', title: t('orders.past'), data: past },
    ].filter((section) => section.data.length > 0);
  }, [data, t]);

  const open = (order: Order) => router.push({ pathname: '/orders/[id]', params: { id: order.id, branchId: order.branchId, brandId: order.brandId } });

  return (
    <TabScreen title={t('orders.title')}>
      {isLoading ? (
        <View style={styles.skeletons}>
          <Skeleton height={112} radius={16} />
          <Skeleton height={112} radius={16} />
        </View>
      ) : isError && !data ? (
        <ErrorState message={t('orders.loadFailed')} onRetry={() => void refetch()} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(order) => order.id}
          renderItem={({ item }) => <OrderRow order={item} onPress={() => open(item)} />}
          renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
          ItemSeparatorComponent={() => <View style={styles.gap} />}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState icon={<UtensilsCrossed size={32} color={colors.primarySoftForeground} />} title={t('orders.emptyTitle')} body={t('orders.emptyBody')} />
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
        />
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: space.lg, paddingTop: space.sm, flexGrow: 1 },
  skeletons: { padding: space.lg, paddingTop: space.sm, gap: space.md },
  section: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground, paddingTop: space.md, paddingBottom: space.sm },
  gap: { height: space.md },
});
