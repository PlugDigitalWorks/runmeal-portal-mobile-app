import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Heart, UtensilsCrossed } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductRow } from '@/components/ProductRow';
import { RestaurantHeader } from '@/components/RestaurantHeader';
import { isOpenNow, nextOpening } from '@/lib/branch-model';
import { activeSection, sectionScrollTarget, tabsPinned } from '@/lib/menu-sections';
import { qk } from '@/queries/keys';
import { useBranch } from '@/queries/useBranch';
import { useFavorites } from '@/queries/useFavorites';
import { useMenu } from '@/queries/useMenu';
import { colors, font, space, weight } from '@/theme';
import type { Branch } from '@/types/branch';
import type { MenuCategory } from '@/types/product';
import { Chip } from '@/ui/Chip';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';

/** Height of the native stack header, which floats over the page because the header is transparent. */
const NAV_BAR = 44;
/** Scroll events inside this window after a chip tap are the animation's own; they must not re-select chips. */
const SCROLL_LOCK_MS = 800;

/** A restaurant: header with banner, sticky category tabs and the menu grouped by category. */
export default function Restaurant() {
  const { t } = useTranslation();
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const branchQuery = useBranch(branchId);
  const menuQuery = useMenu(branchId);
  const { isFavorite, toggle } = useFavorites();

  const branch = branchQuery.data;
  const menu = menuQuery.data;
  const brandId = menu?.brandId ?? branch?.brandId;
  const hours = branch?.business_hour ?? branch?.parameters?.business_hours;
  const open = isOpenNow(hours);
  // The detail call has no distance; borrow it from whatever the home feed already fetched.
  const distanceM = useMemo(() => {
    for (const [, rows] of queryClient.getQueriesData<Branch[]>({ queryKey: qk.nearbyAll })) {
      const match = rows?.find((b) => b.id === branchId);
      if (match) return match.distanceM;
    }
    return null;
  }, [queryClient, branchId]);

  const categories = useMemo(() => (menu?.categories ?? []).filter((c) => c.products.length > 0), [menu]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const sectionY = useRef<Record<string, number>>({});
  const tabsLayout = useRef({ y: 0, height: 0 });
  const lockedUntil = useRef(0);
  const selected = activeId ?? categories[0]?.id ?? null;
  const pinnedHeight = insets.top + NAV_BAR;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      setStuck(tabsPinned(contentOffset.y, pinnedHeight, tabsLayout.current.y));
      if (Date.now() < lockedUntil.current) return;
      const current = activeSection(
        categories.map((c) => c.id),
        sectionY.current,
        { offset: contentOffset.y, viewportHeight: layoutMeasurement.height, contentHeight: contentSize.height },
        pinnedHeight,
        tabsLayout.current.height,
      );
      if (current) setActiveId(current);
    },
    [categories, pinnedHeight],
  );

  const goTo = (id: string) => {
    setActiveId(id);
    lockedUntil.current = Date.now() + SCROLL_LOCK_MS;
    const y = sectionScrollTarget(sectionY.current[id], pinnedHeight, tabsLayout.current.height);
    if (y != null) scrollRef.current?.scrollTo({ y, animated: true });
  };

  const openProduct = (id: string) => {
    if (!open) {
      Alert.alert(t('restaurant.closedBanner'));
      return;
    }
    router.push({ pathname: '/product/[id]', params: { id, branchId, brandId } });
  };

  const failed = branchQuery.isError || menuQuery.isError;
  const retry = () => {
    branchQuery.refetch();
    menuQuery.refetch();
  };

  const favorite = branch ? isFavorite(branch.id) : false;
  const heart = branch ? (
    <Pressable
      onPress={() => toggle({ id: branch.id, name: branch.name, logoUrl: branch.logoUrl, bannerUrls: branch.bannerUrls, addressText: branch.addressText })}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t(favorite ? 'home.removeFavorite' : 'home.addFavorite')}
    >
      <Heart size={22} color={colors.primary} fill={favorite ? colors.primary : 'transparent'} />
    </Pressable>
  ) : null;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerRight: () => heart }} />
      {failed ? (
        <View style={[styles.center, { paddingTop: pinnedHeight }]}>
          <ErrorState onRetry={retry} />
        </View>
      ) : !branch || !menu ? (
        <View style={styles.loading}>
          <Skeleton height={200} radius={0} />
          <View style={styles.loadingBody}>
            <Skeleton width="55%" height={24} />
            <Skeleton width="80%" height={14} />
            <Skeleton height={88} />
            <Skeleton height={88} />
          </View>
        </View>
      ) : (
        <>
          <ScrollView testID="menu-scroll" ref={scrollRef} onScroll={onScroll} scrollEventThrottle={32} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <RestaurantHeader branch={branch} distanceM={distanceM} open={open} opensAt={open ? null : nextOpening(hours)} />
            {categories.length === 0 ? (
              <EmptyState icon={<UtensilsCrossed size={32} color={colors.primarySoftForeground} />} title={t('restaurant.emptyMenu')} />
            ) : (
              <>
                <View testID="menu-tabs" onLayout={(e) => (tabsLayout.current = { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })}>
                  <MenuTabs categories={categories} selected={selected} onSelect={goTo} />
                </View>
                {categories.map((category) => (
                  <View key={category.id} testID={`section-${category.id}`} onLayout={(e) => (sectionY.current[category.id] = e.nativeEvent.layout.y)}>
                    <Text style={styles.sectionTitle}>{category.name}</Text>
                    {category.products.map((product) => (
                      <ProductRow key={product.id} product={product} onPress={() => openProduct(product.id)} />
                    ))}
                  </View>
                ))}
              </>
            )}
          </ScrollView>
          {/* Pinned copy of the tabs: sits over the nav bar once the in-flow row scrolls under it, without shifting the content. */}
          {stuck && categories.length > 0 ? (
            <View testID="menu-tabs-pinned" style={[styles.pinned, { paddingTop: pinnedHeight }]} pointerEvents="box-none">
              <MenuTabs categories={categories} selected={selected} onSelect={goTo} />
            </View>
          ) : null}
          {/* Task 9 mounts the CartBar here. */}
          <View />
        </>
      )}
    </View>
  );
}

type TabsProps = { categories: MenuCategory[]; selected: string | null; onSelect: (id: string) => void };

/** Horizontal category pills; keeps the selected one scrolled into view as the page moves. */
function MenuTabs({ categories, selected, onSelect }: TabsProps) {
  const ref = useRef<ScrollViewInstance>(null);
  const chipX = useRef<Record<string, number>>({});
  useEffect(() => {
    const x = selected ? chipX.current[selected] : undefined;
    if (x != null) ref.current?.scrollTo({ x: Math.max(0, x - space.lg), animated: true });
  }, [selected]);
  return (
    <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} style={styles.tabsBar}>
      {categories.map((category) => (
        <View
          key={category.id}
          onLayout={(e) => {
            chipX.current[category.id] = e.nativeEvent.layout.x;
            // A freshly mounted (pinned) row learns the positions late; catch up for the chip that is already selected.
            if (category.id === selected) ref.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - space.lg), animated: false });
          }}
        >
          <Chip label={category.name} selected={category.id === selected} onPress={() => onSelect(category.id)} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: space.xxl },
  center: { flex: 1, justifyContent: 'center' },
  loading: { flex: 1 },
  loadingBody: { padding: space.lg, gap: space.md },
  tabsBar: { backgroundColor: colors.background },
  tabs: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.sm },
  pinned: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.background },
  sectionTitle: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground, paddingHorizontal: space.lg, paddingTop: space.lg },
});
