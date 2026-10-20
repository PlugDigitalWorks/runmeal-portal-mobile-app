import { useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Search, SearchX, UtensilsCrossed } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartBar } from '@/components/CartBar';
import { ProductRow } from '@/components/ProductRow';
import { CartProgress } from '@/components/restaurant/CartProgress';
import { CouponStrip } from '@/components/restaurant/CouponStrip';
import { DiscountedProducts } from '@/components/restaurant/DiscountedProducts';
import { FulfillmentToggle } from '@/components/restaurant/FulfillmentToggle';
import { MenuSearch } from '@/components/restaurant/MenuSearch';
import { MenuTabs, type MenuTab } from '@/components/restaurant/MenuTabs';
import { PaymentMethodsRow } from '@/components/restaurant/PaymentMethodsRow';
import { PopularProducts } from '@/components/restaurant/PopularProducts';
import { COVER_OVERLAP, RestaurantHero, RoundButton } from '@/components/restaurant/RestaurantHero';
import { RestaurantInfoCard } from '@/components/restaurant/RestaurantInfoCard';
import { RestaurantInfoSheet } from '@/components/restaurant/RestaurantInfoSheet';
import { ReviewsSheet } from '@/components/restaurant/ReviewsSheet';
import { SHOW_MOCKS } from '@/config';
import { formatDistance, fulfillmentOf, isOpenNow, nextOpening, paymentMethodsFor, settingsOf, todayHours, type Fulfillment } from '@/lib/branch-model';
import { matchedCategory, menuText } from '@/lib/categories';
import { discountedProducts, popularProducts } from '@/lib/menu-picks';
import { searchMenu } from '@/lib/menu-search';
import { activeSection, sectionScrollTarget, tabsPinned } from '@/lib/menu-sections';
import { isDistinguished } from '@/mocks/home-mocks';
import { mockOffers } from '@/mocks/restaurant-mocks';
import { qk } from '@/queries/keys';
import { useBranch } from '@/queries/useBranch';
import { useFavorites } from '@/queries/useFavorites';
import { useMenu } from '@/queries/useMenu';
import { colors, font, space, weight } from '@/theme';
import type { Branch } from '@/types/branch';
import type { MenuProduct } from '@/types/product';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';

/** A deep link can land here with nothing behind it; go home then instead of failing. */
const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

/** Height of the pinned title row (back button and name) that sits above the tabs once they stick. */
const NAV_BAR = 44;
/** Scroll events inside this window after a tab tap are the animation's own; they must not re-select tabs. */
const SCROLL_LOCK_MS = 800;

/**
 * A restaurant, a mix of Yemeksepeti, Uber Eats and Getir: a narrow cover, a title card with the info that
 * decides an order, then the menu (search, sticky tabs, popular and discounted rails, the product rows).
 * Fields the API cannot back yet carry a "Mock" tag and vanish when `SHOW_MOCKS` is off.
 */
export default function Restaurant() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
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
  const [query, setQuery] = useState('');
  const searching = query.trim() !== '';
  const visibleCategories = useMemo(() => searchMenu(categories, query), [categories, query]);
  const popular = useMemo(() => popularProducts(categories), [categories]);
  const discounted = useMemo(() => discountedProducts(categories), [categories]);
  // A stand-in popular list is a mock: without mocks the section (and its tab) is not worth showing.
  const showPopular = popular.products.length > 0 && (!popular.mocked || SHOW_MOCKS);
  const tabs = useMemo<MenuTab[]>(
    () => [
      ...(showPopular ? [{ id: 'popular', label: t('restaurant.popularTab') }] : []),
      ...(discounted.length > 0 ? [{ id: 'discounted', label: t('restaurant.discountedTab') }] : []),
      ...categories.map((c) => ({ id: c.id, label: c.name })),
    ],
    [showPopular, discounted.length, categories, t],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [stuck, setStuck] = useState(false);
  const [chosenMode, setChosenMode] = useState<Fulfillment>('delivery');
  const [infoOpen, setInfoOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const searchRef = useRef<TextInputInstance>(null);
  const searchY = useRef(0);
  const sectionY = useRef<Record<string, number>>({});
  const tabsLayout = useRef({ y: 0, height: 0 });
  const lockedUntil = useRef(0);
  const selected = activeId ?? tabs[0]?.id ?? null;
  const pinnedHeight = insets.top + NAV_BAR;

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      setStuck(tabsPinned(contentOffset.y, pinnedHeight, tabsLayout.current.y));
      if (searching || Date.now() < lockedUntil.current) return;
      const current = activeSection(
        tabs.map((tab) => tab.id),
        sectionY.current,
        { offset: contentOffset.y, viewportHeight: layoutMeasurement.height, contentHeight: contentSize.height },
        pinnedHeight,
        tabsLayout.current.height,
      );
      if (current) setActiveId(current);
    },
    [tabs, pinnedHeight, searching],
  );

  const goTo = (id: string) => {
    setActiveId(id);
    lockedUntil.current = Date.now() + SCROLL_LOCK_MS;
    const y = sectionScrollTarget(sectionY.current[id], pinnedHeight, tabsLayout.current.height);
    if (y != null) scrollRef.current?.scrollTo({ y, animated: true });
  };

  const focusSearch = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, searchY.current - pinnedHeight - space.sm), animated: true });
    searchRef.current?.focus();
  };

  const openProduct = (id: string) => {
    if (!open) {
      Alert.alert(t('restaurant.closedBanner'));
      return;
    }
    router.push({ pathname: '/product/[id]', params: { id, branchId, brandId } });
  };
  const openItem = (product: MenuProduct) => openProduct(product.id);

  const failed = branchQuery.isError || menuQuery.isError;
  const retry = () => {
    branchQuery.refetch();
    menuQuery.refetch();
  };

  const back = (
    <View style={[styles.floatingBack, { top: insets.top + space.sm }]}>
      <RoundButton label={t('restaurant.back')} onPress={() => goBack()}>
        <ArrowLeft size={20} color={colors.foreground} />
      </RoundButton>
    </View>
  );

  if (failed || !branch || !menu) {
    return (
      <View style={styles.root}>
        <Stack.Screen options={{ headerShown: false }} />
        {failed ? (
          <View style={[styles.center, { paddingTop: pinnedHeight }]}>
            <ErrorState onRetry={retry} />
          </View>
        ) : (
          <View style={styles.loading}>
            <Skeleton height={150 + insets.top} radius={0} />
            <View style={styles.loadingBody}>
              <Skeleton width="60%" height={24} />
              <Skeleton width="85%" height={14} />
              <Skeleton height={64} />
              <Skeleton height={104} />
              <Skeleton height={104} />
            </View>
          </View>
        )}
        {back}
      </View>
    );
  }

  const settings = settingsOf(branch);
  const options = fulfillmentOf(settings);
  const mode = options.includes(chosenMode) ? chosenMode : (options[0] ?? 'delivery');
  const cuisine = matchedCategory({ ...branch, distanceM: null } as Branch, menuText(menu));
  const subtitle = [cuisine ? t(`categories.${cuisine}`) : '', formatDistance(distanceM, lang), todayHours(hours) ?? ''].filter(Boolean).join(' · ');
  const apiMin = branch.minBasketPrice != null && Number(branch.minBasketPrice) > 0 ? Number(branch.minBasketPrice) : null;
  const favorite = isFavorite(branch.id);
  const offers = SHOW_MOCKS ? mockOffers(branch.id, branch.currency, open) : [];

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* The cover is dark under the status bar until the page scrolls; the pinned bar is light. */}
      <StatusBar style={stuck ? 'dark' : 'light'} />
      <ScrollView
        testID="menu-scroll"
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
      >
        <RestaurantHero
          branch={branch}
          favorite={favorite}
          selected={isDistinguished(branch.id)}
          onBack={() => goBack()}
          onSearch={focusSearch}
          onToggleFavorite={() => toggle({ id: branch.id, name: branch.name, logoUrl: branch.logoUrl, bannerUrls: branch.bannerUrls, addressText: branch.addressText })}
        />
        <View style={styles.titleCard}>
          <RestaurantInfoCard
            branchId={branch.id}
            name={branch.name}
            logoUrl={branch.logoUrl}
            subtitle={subtitle}
            open={open}
            opensAt={open ? null : nextOpening(hours)}
            onInfo={() => setInfoOpen(true)}
            onReviews={() => setReviewsOpen(true)}
          />
          {!open ? (
            <View style={styles.strip}>
              <Text style={styles.stripText}>{t('restaurant.closedBanner')}</Text>
            </View>
          ) : null}
          <FulfillmentToggle
            branchId={branch.id}
            options={options}
            mode={mode}
            onModeChange={setChosenMode}
            distanceM={distanceM}
            minBasket={apiMin}
            currency={branch.currency}
            symbol={branch.currencySymbol}
            addressText={branch.addressText}
          />
          <PaymentMethodsRow methods={paymentMethodsFor(settings)} />
        </View>
        {offers.length > 0 ? (
          <View style={styles.coupons}>
            <CouponStrip offers={offers} currency={branch.currency} symbol={branch.currencySymbol} />
          </View>
        ) : null}
        {categories.length === 0 ? (
          <View style={styles.menuZone}>
            <EmptyState icon={<UtensilsCrossed size={32} color={colors.primarySoftForeground} />} title={t('restaurant.emptyMenu')} />
          </View>
        ) : (
          <>
            <View style={[styles.menuZone, styles.searchZone]} onLayout={(e) => (searchY.current = e.nativeEvent.layout.y)}>
              <MenuSearch value={query} onChange={setQuery} inputRef={searchRef} />
            </View>
            {searching ? null : (
              <View testID="menu-tabs" style={styles.menuZone} onLayout={(e) => (tabsLayout.current = { y: e.nativeEvent.layout.y, height: e.nativeEvent.layout.height })}>
                <MenuTabs tabs={tabs} selected={selected} onSelect={goTo} />
              </View>
            )}
            {searching ? null : (
              <>
                {showPopular ? (
                  <View testID="section-popular" style={[styles.menuZone, styles.rail]} onLayout={(e) => (sectionY.current.popular = e.nativeEvent.layout.y)}>
                    <PopularProducts products={popular.products} mocked={popular.mocked} onPress={openItem} />
                  </View>
                ) : null}
                {discounted.length > 0 ? (
                  <View testID="section-discounted" style={[styles.menuZone, styles.rail]} onLayout={(e) => (sectionY.current.discounted = e.nativeEvent.layout.y)}>
                    <DiscountedProducts products={discounted} onPress={openItem} />
                  </View>
                ) : null}
              </>
            )}
            {visibleCategories.length === 0 ? (
              <View style={styles.menuZone}>
                <EmptyState icon={<SearchX size={32} color={colors.primarySoftForeground} />} title={t('restaurant.searchEmpty', { query: query.trim() })} />
              </View>
            ) : (
              visibleCategories.map((category) => (
                <View key={category.id} testID={`section-${category.id}`} style={styles.menuZone} onLayout={(e) => (sectionY.current[category.id] = e.nativeEvent.layout.y)}>
                  <Text style={styles.sectionTitle}>{t('restaurant.categoryTitle', { name: category.name, count: category.products.length })}</Text>
                  {category.products.map((product) => (
                    <ProductRow key={product.id} product={product} onPress={() => openProduct(product.id)} />
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
      {/* Pinned copy of the tabs: sits at the top once the in-flow row scrolls under the status bar, without shifting the content. While searching only the title row stays, so back and search remain reachable. */}
      {stuck && (searching || tabs.length > 0) ? (
        <View testID="menu-tabs-pinned" style={[styles.pinned, { paddingTop: insets.top }]} pointerEvents="box-none">
          <View style={styles.pinnedBar}>
            <Pressable onPress={() => goBack()} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('restaurant.back')} style={styles.pinnedButton}>
              <ArrowLeft size={22} color={colors.foreground} />
            </Pressable>
            <Text style={styles.pinnedTitle} numberOfLines={1}>
              {branch.name}
            </Text>
            <Pressable onPress={focusSearch} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('restaurant.search')} style={styles.pinnedButton}>
              <Search size={20} color={colors.foreground} />
            </Pressable>
          </View>
          {searching ? null : <MenuTabs tabs={tabs} selected={selected} onSelect={goTo} />}
        </View>
      ) : null}
      <RestaurantInfoSheet visible={infoOpen} onClose={() => setInfoOpen(false)} branch={branch} hours={hours} />
      {SHOW_MOCKS ? <ReviewsSheet visible={reviewsOpen} onClose={() => setReviewsOpen(false)} branchId={branch.id} /> : null}
      <CartProgress branchId={branch.id} currency={branch.currency} symbol={branch.currencySymbol} />
      <CartBar safeBottom />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: space.xxl },
  center: { flex: 1, justifyContent: 'center' },
  loading: { flex: 1 },
  loadingBody: { padding: space.lg, gap: space.md },
  floatingBack: { position: 'absolute', left: space.lg },
  // The white title card climbs over the cover and carries everything that decides an order.
  titleCard: { marginTop: -COVER_OVERLAP, paddingTop: space.lg, paddingBottom: space.lg, gap: space.md, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: colors.card },
  strip: { backgroundColor: colors.destructiveSoft, paddingHorizontal: space.lg, paddingVertical: space.md },
  stripText: { fontSize: font.body, fontWeight: weight.semibold, color: colors.destructive },
  coupons: { paddingVertical: space.md },
  menuZone: { backgroundColor: colors.card },
  searchZone: { paddingTop: space.lg, paddingBottom: space.md, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  rail: { paddingVertical: space.lg },
  pinned: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.card },
  pinnedBar: { height: NAV_BAR, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg },
  pinnedButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  pinnedTitle: { flex: 1, fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  sectionTitle: { fontSize: 20, fontWeight: weight.bold, color: colors.foreground, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.xs },
});
