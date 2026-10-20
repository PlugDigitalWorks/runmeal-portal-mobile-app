import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { bannerOf, formatDistance, isOpenNow, nextOpening } from '@/lib/branch-model';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import type { Branch } from '@/types/branch';

type Props = { branch: Branch; isFavorite: boolean; onToggleFavorite: () => void };

/** One restaurant in the home feed: banner with a half-overlapping logo, favourite heart, name and distance. */
export function BranchCard({ branch, isFavorite, onToggleFavorite }: Props) {
  const { t, i18n } = useTranslation();
  const open = isOpenNow(branch.business_hour);
  const opensAt = open ? null : nextOpening(branch.business_hour);
  const banner = bannerOf(branch);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/restaurant/[branchId]', params: { branchId: branch.id } })}
      style={[styles.card, !open && styles.closed]}
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
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          style={styles.heart}
          accessibilityRole="button"
          accessibilityLabel={t(isFavorite ? 'home.removeFavorite' : 'home.addFavorite')}
        >
          <Heart size={18} color={colors.primary} fill={isFavorite ? colors.primary : 'transparent'} />
        </Pressable>
      </View>
      {banner && branch.logoUrl ? (
        <View style={styles.logo}>
          <Image source={{ uri: branch.logoUrl }} contentFit="contain" style={styles.logoImage} />
        </View>
      ) : null}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text testID="branch-card-name" style={styles.name} numberOfLines={1}>
            {branch.name}
          </Text>
          <Text style={styles.distance}>{formatDistance(branch.distanceM, i18n.language === 'tr' ? 'tr' : 'en')}</Text>
        </View>
        {branch.addressText ? (
          <Text style={styles.address} numberOfLines={1}>
            {branch.addressText}
          </Text>
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
  closed: { opacity: 0.55 },
  // Clipped on its own so the logo can hang over the banner's edge while the card keeps its shadow.
  banner: {
    height: 140,
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
  heart: {
    position: 'absolute',
    top: space.md,
    right: space.md,
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    position: 'absolute',
    top: 140 - 20,
    left: space.md,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.card,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  body: { padding: space.md, paddingTop: space.lg + space.sm, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { flex: 1, fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
  distance: { fontSize: font.small, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  address: { fontSize: font.small, color: colors.mutedForeground },
});
