import { Image } from 'expo-image';
import { Bike, Heart, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bannerOf, formatDistance } from '@/lib/branch-model';
import { formatMoneyWhole } from '@/lib/money';
import { mockDelivery, mockMinBasket, mockRating, mockRatingCount } from '@/mocks/home-mocks';
import { colors, font, radius, space, weight } from '@/theme';
import type { Branch } from '@/types/branch';

type Props = { branch: Branch; isFavorite: boolean; onToggleFavorite: () => void; cuisineLabel?: string; onOpen: () => void };

/**
 * One tile of the two-column deals grid (mock values): the photo fills the square card, the green rating
 * pill sits top left, a white heart top right, and a dark translucent panel at the bottom carries the name,
 * "Min · distance · cuisine" and the delivery time.
 */
export function DealCard({ branch, isFavorite, onToggleFavorite, cuisineLabel, onOpen }: Props) {
  const { t, i18n } = useTranslation();
  const banner = bannerOf(branch);
  const apiMin = branch.minBasketPrice != null ? Number(branch.minBasketPrice) : 0;
  const min = apiMin > 0 ? apiMin : mockMinBasket(branch.id, branch.currency);
  const eta = mockDelivery(branch.distanceM);
  const info = [t('home.minBasket', { amount: formatMoneyWhole(min, branch.currency) }), formatDistance(branch.distanceM, i18n.language === 'tr' ? 'tr' : 'en'), cuisineLabel ?? ''].filter(Boolean);

  return (
    <Pressable style={styles.card} onPress={onOpen} accessibilityRole="button" accessibilityLabel={branch.name}>
      {banner ? <Image source={{ uri: banner }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={StyleSheet.absoluteFill} /> : null}
      <View style={styles.rating}>
        <Star size={11} color={colors.primaryForeground} fill={colors.primaryForeground} />
        <Text style={styles.ratingText}>{`${mockRating(branch.id).toFixed(1)} (${mockRatingCount(branch.id)}+)`}</Text>
      </View>
      <Pressable
        onPress={onToggleFavorite}
        hitSlop={8}
        style={styles.heart}
        accessibilityRole="button"
        accessibilityLabel={t(isFavorite ? 'home.removeFavorite' : 'home.addFavorite')}
      >
        <Heart size={16} color={colors.foreground} fill={isFavorite ? colors.primary : 'transparent'} />
      </Pressable>
      <View style={styles.panel}>
        <Text testID="deal-card-name" style={styles.name} numberOfLines={1}>
          {branch.name}
        </Text>
        <Text style={styles.info} numberOfLines={1}>
          {info.join(' · ')}
        </Text>
        <View style={styles.eta}>
          <Bike size={12} color={colors.foreground} />
          <Text style={styles.etaText}>{t('home.minutes', { from: eta.from, to: eta.to })}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, aspectRatio: 1, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.bannerPlaceholder, justifyContent: 'flex-end' },
  rating: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderBottomRightRadius: radius.md,
    backgroundColor: colors.success,
  },
  ratingText: { fontSize: font.caption, fontWeight: weight.bold, color: colors.primaryForeground },
  heart: { position: 'absolute', top: space.sm, right: space.sm, width: 30, height: 30, borderRadius: radius.full, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  panel: { padding: space.sm, gap: 2, backgroundColor: 'rgba(16,25,46,0.6)' },
  name: { fontSize: 15, fontWeight: weight.bold, color: colors.primaryForeground },
  info: { fontSize: font.small, color: 'rgba(255,255,255,0.85)' },
  eta: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: 'rgba(255,255,255,0.9)' },
  etaText: { fontSize: font.caption, fontWeight: weight.bold, color: colors.foreground },
});
