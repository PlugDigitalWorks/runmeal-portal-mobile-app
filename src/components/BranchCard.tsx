import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Award, BadgePercent, Bike, Heart, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { bannerOf, formatDistance, isOpenNow, nextOpening } from '@/lib/branch-model';
import { formatMoneyWhole } from '@/lib/money';
import { branchPromos, hasPlusBadge, isDistinguished, isSponsored, mockDelivery, mockMinBasket, mockRating, mockRatingCount, promoAmount } from '@/mocks/home-mocks';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import type { Branch } from '@/types/branch';
import { MockTag } from '@/ui/MockTag';

export const COMPACT_CARD_WIDTH = 280;

type Props = {
  branch: Branch;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  /** `compact` is the fixed-width card of the horizontal rows; `full` fills the list width. */
  variant?: 'full' | 'compact';
  /** Name of the first cuisine the branch matches (an estimate, see categories.ts). */
  cuisineLabel?: string;
  /** Replaces the default "open the restaurant page" tap, for a card inside a sheet that must close first. */
  onOpen?: () => void;
};

/**
 * One restaurant, Uber Eats style: banner with orange promo strips, a green rating pill and a heart,
 * then the name (medal, "Sponsorlu"), a grey line of minimum basket, distance and cuisine, and the
 * delivery time. Promos, rating, medal, sponsoring, delivery time and a missing minimum basket are
 * mock values; one small "Mock" tag above the heart labels them all.
 */
export function BranchCard({ branch, isFavorite, onToggleFavorite, variant = 'full', cuisineLabel, onOpen }: Props) {
  const { t, i18n } = useTranslation();
  const open = isOpenNow(branch.business_hour);
  const opensAt = open ? null : nextOpening(branch.business_hour);
  const banner = bannerOf(branch);
  const apiMin = branch.minBasketPrice != null ? Number(branch.minBasketPrice) : 0;
  const min = apiMin > 0 ? apiMin : SHOW_MOCKS ? mockMinBasket(branch.id, branch.currency) : 0;
  const promos = SHOW_MOCKS && open ? branchPromos(branch.id) : [];
  const info = [
    min > 0 ? t('home.minBasket', { amount: formatMoneyWhole(min, branch.currency) }) : '',
    formatDistance(branch.distanceM, i18n.language === 'tr' ? 'tr' : 'en'),
    cuisineLabel ?? '',
  ].filter(Boolean);
  const eta = mockDelivery(branch.distanceM);

  return (
    <Pressable
      onPress={onOpen ?? (() => router.push({ pathname: '/restaurant/[branchId]', params: { branchId: branch.id } }))}
      style={[styles.card, variant === 'compact' && styles.compact, !open && styles.closed]}
      accessibilityRole="button"
    >
      <View style={styles.banner}>
        {banner ? (
          <Image source={{ uri: banner }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={StyleSheet.absoluteFill} />
        ) : branch.logoUrl ? (
          <Image source={{ uri: branch.logoUrl }} contentFit="contain" style={styles.placeholderLogo} />
        ) : null}
        {!open ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {t('home.closed')}
              {opensAt ? ` ${t('home.opensAt', { time: opensAt })}` : ''}
            </Text>
          </View>
        ) : null}
        {promos.length > 0 ? (
          <View style={styles.promos}>
            {promos.map((key) => (
              <View key={key} style={styles.promo}>
                <BadgePercent size={14} color={colors.primaryForeground} />
                <Text style={styles.promoText} numberOfLines={1}>
                  {t(`promos.${key}`, { amount: formatMoneyWhole(promoAmount(key, branch.currency), branch.currency) })}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {SHOW_MOCKS ? (
          <>
            {open && hasPlusBadge(branch.id) ? (
              <View style={styles.plus}>
                <Text style={styles.plusText}>{t('home.plusDiscount')}</Text>
              </View>
            ) : null}
            <View style={styles.rating}>
              <Star size={12} color={colors.primaryForeground} fill={colors.primaryForeground} />
              <Text style={styles.ratingText}>{`${mockRating(branch.id).toFixed(1)} (${mockRatingCount(branch.id)}+)`}</Text>
            </View>
            <View style={styles.mockTag}>
              <MockTag />
            </View>
          </>
        ) : null}
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={styles.heart}
          accessibilityRole="button"
          accessibilityLabel={t(isFavorite ? 'home.removeFavorite' : 'home.addFavorite')}
        >
          <Heart size={18} color={colors.foreground} fill={isFavorite ? colors.primary : 'transparent'} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          {SHOW_MOCKS && isDistinguished(branch.id) ? <Award size={18} color={colors.primary} accessibilityLabel={t('home.distinguished')} /> : null}
          <Text testID="branch-card-name" style={styles.name} numberOfLines={1}>
            {branch.name}
          </Text>
          {SHOW_MOCKS && isSponsored(branch.id) ? (
            <View style={styles.sponsored}>
              <Text style={styles.sponsoredText}>{t('home.sponsored')}</Text>
            </View>
          ) : null}
        </View>
        {info.length ? (
          <Text style={styles.info} numberOfLines={1}>
            {info.join(' · ')}
          </Text>
        ) : null}
        {SHOW_MOCKS ? (
          <View style={styles.etaRow}>
            <Bike size={14} color={colors.mutedForeground} />
            <Text style={styles.info}>{t('home.minutes', { from: eta.from, to: eta.to })}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // No border: a white card and the soft shadow are enough on the cream canvas.
  card: { backgroundColor: colors.card, borderRadius: radius.lg, ...shadow.card },
  compact: { width: COMPACT_CARD_WIDTH },
  closed: { opacity: 0.55 },
  banner: {
    height: 180,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bannerPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderLogo: { width: 72, height: 72 },
  badge: {
    position: 'absolute',
    top: space.md,
    left: space.md,
    paddingHorizontal: space.md,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.foreground,
  },
  badgeText: { fontSize: font.small, fontWeight: weight.semibold, color: colors.primaryForeground },
  promos: { position: 'absolute', top: space.sm, left: space.sm, maxWidth: '85%', gap: 4, alignItems: 'flex-start' },
  promo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.promo,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  promoText: { flexShrink: 1, fontSize: font.small, fontWeight: weight.bold, color: colors.primaryForeground },
  plus: {
    position: 'absolute',
    left: space.sm,
    bottom: 44,
    maxWidth: 76,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
  },
  plusText: { fontSize: font.caption, lineHeight: 13, fontWeight: weight.bold, color: colors.primarySoftForeground },
  rating: {
    position: 'absolute',
    left: space.sm,
    bottom: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.success,
  },
  ratingText: { fontSize: font.small, fontWeight: weight.bold, color: colors.primaryForeground },
  mockTag: { position: 'absolute', right: space.sm, bottom: 52 },
  heart: {
    position: 'absolute',
    right: space.sm,
    bottom: space.sm,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: space.md, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  sponsored: { marginLeft: 'auto', paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.searchFill },
  sponsoredText: { fontSize: font.caption, fontWeight: weight.semibold, color: colors.mutedForeground },
  info: { fontSize: 13, color: colors.mutedForeground },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
