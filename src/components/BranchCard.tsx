import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Bike, Heart, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { bannerOf, formatDistance, isOpenNow, nextOpening } from '@/lib/branch-model';
import { formatMoney } from '@/lib/money';
import { mockDelivery, mockRating, mockRatingCount } from '@/mocks/home-mocks';
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
};

/**
 * One restaurant: banner with a favourite heart (and the closed badge), name, and a grey line of
 * minimum basket, distance and cuisine. Rating and delivery time are mock values, always tagged.
 */
export function BranchCard({ branch, isFavorite, onToggleFavorite, variant = 'full', cuisineLabel }: Props) {
  const { t, i18n } = useTranslation();
  const open = isOpenNow(branch.business_hour);
  const opensAt = open ? null : nextOpening(branch.business_hour);
  const banner = bannerOf(branch);
  const min = branch.minBasketPrice != null ? Number(branch.minBasketPrice) : 0;
  const info = [
    min > 0 ? t('home.minBasket', { amount: formatMoney(min, branch.currency) }) : '',
    formatDistance(branch.distanceM, i18n.language === 'tr' ? 'tr' : 'en'),
    cuisineLabel ?? '',
  ].filter(Boolean);
  const eta = mockDelivery(branch.distanceM);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/restaurant/[branchId]', params: { branchId: branch.id } })}
      style={[styles.card, variant === 'compact' && styles.compact, !open && styles.closed]}
      accessibilityRole="button"
    >
      <View style={styles.banner}>
        {banner ? (
          <Image source={{ uri: banner }} contentFit="cover" style={StyleSheet.absoluteFill} />
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
        {SHOW_MOCKS ? (
          <View style={styles.rating}>
            <Star size={12} color={colors.foreground} fill={colors.foreground} />
            <Text style={styles.ratingText}>{`${mockRating(branch.id).toFixed(1)} (${mockRatingCount(branch.id)}+)`}</Text>
            <MockTag />
          </View>
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
        <Text testID="branch-card-name" style={styles.name} numberOfLines={1}>
          {branch.name}
        </Text>
        {info.length ? (
          <Text style={styles.info} numberOfLines={1}>
            {info.join(' · ')}
          </Text>
        ) : null}
        {SHOW_MOCKS ? (
          <View style={styles.etaRow}>
            <Bike size={14} color={colors.mutedForeground} />
            <Text style={styles.info}>{t('home.minutes', { from: eta.from, to: eta.to })}</Text>
            <MockTag />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  compact: { width: COMPACT_CARD_WIDTH },
  closed: { opacity: 0.55 },
  banner: {
    height: 150,
    borderTopLeftRadius: radius.lg - 1,
    borderTopRightRadius: radius.lg - 1,
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
  rating: {
    position: 'absolute',
    left: space.md,
    bottom: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: space.sm,
    paddingRight: 4,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  ratingText: { fontSize: font.small, fontWeight: weight.semibold, color: colors.foreground },
  heart: {
    position: 'absolute',
    right: space.md,
    bottom: space.md,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: space.md, gap: 3 },
  name: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  info: { fontSize: 13, color: colors.mutedForeground },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
