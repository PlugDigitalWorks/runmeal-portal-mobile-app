import { Image } from 'expo-image';
import { ChevronRight, Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { restaurantRating } from '@/mocks/restaurant-mocks';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import { MockTag } from '@/ui/MockTag';
import { ratingText } from './format';
import { RatingMark } from './RatingMark';

const LOGO = 56;

type Props = {
  branchId: string;
  name: string;
  logoUrl: string | null;
  /** Cuisine estimate, distance and today's hours already joined with " · "; empty hides the line. */
  subtitle: string;
  open: boolean;
  /** Next opening time later today, when closed. */
  opensAt: string | null;
  onInfo: () => void;
  onReviews: () => void;
};

/** Logo, name with the open/closed badge, the grey info line (with the info button) and the rating box (a mock). */
export function RestaurantInfoCard({ branchId, name, logoUrl, subtitle, open, opensAt, onInfo, onReviews }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
  const { rating, count } = restaurantRating(branchId);

  return (
    <View style={styles.row}>
      <View style={styles.logo}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} contentFit="contain" cachePolicy="memory-disk" style={styles.logoImage} />
        ) : (
          <Text style={styles.initial}>{name.trim().charAt(0).toLocaleUpperCase(lang)}</Text>
        )}
      </View>
      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.badge, open ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={[styles.badgeText, { color: open ? colors.success : colors.destructive }]} numberOfLines={1}>
              {open ? t('restaurant.open') : opensAt ? t('restaurant.closedOpensAt', { time: opensAt }) : t('restaurant.closed')}
            </Text>
          </View>
        </View>
        <Pressable onPress={onInfo} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('restaurant.info')} style={styles.infoLine}>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          <Info size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>
      {SHOW_MOCKS ? (
        <Pressable onPress={onReviews} accessibilityRole="button" accessibilityLabel={t('restaurant.reviewsOpen')} style={styles.rating}>
          <View style={styles.ratingTop}>
            <RatingMark size={14} />
            <Text style={styles.ratingValue}>{ratingText(rating, lang)}</Text>
          </View>
          <View style={styles.ratingBottom}>
            <Text style={styles.ratingCount}>{count >= 100 ? `${count}+` : count}</Text>
            <ChevronRight size={12} color={colors.mutedForeground} />
          </View>
          <MockTag />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingHorizontal: space.lg },
  logo: {
    width: LOGO,
    height: LOGO,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.card,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.card,
  },
  logoImage: { width: '100%', height: '100%' },
  initial: { fontSize: font.heading, fontWeight: weight.bold, color: colors.primarySoftForeground },
  middle: { flex: 1, gap: 4 },
  name: { fontSize: 20, fontWeight: weight.bold, color: colors.foreground },
  statusRow: { flexDirection: 'row' },
  badge: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeOpen: { backgroundColor: colors.successSoft },
  badgeClosed: { backgroundColor: colors.destructiveSoft },
  badgeText: { fontSize: font.caption, fontWeight: weight.semibold },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subtitle: { flexShrink: 1, fontSize: 13, color: colors.mutedForeground },
  rating: { width: 60, alignItems: 'center', gap: 3, paddingVertical: 5, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.card },
  ratingTop: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingValue: { fontSize: font.body, fontWeight: weight.bold, color: colors.foreground },
  ratingBottom: { flexDirection: 'row', alignItems: 'center' },
  ratingCount: { fontSize: font.small, color: colors.mutedForeground },
});
