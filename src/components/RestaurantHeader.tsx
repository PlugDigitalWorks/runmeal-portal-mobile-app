import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { bannerOf, formatDistance } from '@/lib/branch-model';
import { colors, font, radius, space, weight } from '@/theme';
import type { BranchDetail } from '@/types/branch';

type Props = {
  branch: BranchDetail;
  distanceM: number | null;
  open: boolean;
  /** Next opening time later today, when closed. */
  opensAt: string | null;
};

const BANNER_HEIGHT = 200;
const LOGO_SIZE = 64;

/** Top of the restaurant page: tall banner, logo hanging over its bottom-left corner, name, info row and the closed strip. */
export function RestaurantHeader({ branch, distanceM, open, opensAt }: Props) {
  const { t, i18n } = useTranslation();
  const banner = bannerOf(branch);
  const distance = formatDistance(distanceM, i18n.language === 'tr' ? 'tr' : 'en');

  return (
    <View>
      <View style={styles.banner}>{banner ? <Image source={{ uri: banner }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}</View>
      {branch.logoUrl ? (
        <View style={styles.logo}>
          <Image source={{ uri: branch.logoUrl }} contentFit="contain" style={styles.logoImage} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={styles.name}>{branch.name}</Text>
        <View style={styles.infoRow}>
          {branch.addressText ? (
            <Text style={styles.info} numberOfLines={1}>
              {branch.addressText}
            </Text>
          ) : null}
          {distance ? <Text style={styles.info}>{distance}</Text> : null}
          <View style={[styles.badge, open ? styles.badgeOpen : styles.badgeClosed]}>
            <Text style={[styles.badgeText, { color: open ? colors.success : colors.destructive }]}>
              {open ? t('restaurant.open') : opensAt ? t('restaurant.closedOpensAt', { time: opensAt }) : t('restaurant.closed')}
            </Text>
          </View>
        </View>
      </View>
      {!open ? (
        <View style={styles.strip}>
          <Text style={styles.stripText}>{t('restaurant.closedBanner')}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { height: BANNER_HEIGHT, backgroundColor: colors.bannerPlaceholder },
  logo: {
    position: 'absolute',
    top: BANNER_HEIGHT - LOGO_SIZE / 2,
    left: space.lg,
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: radius.full,
    borderWidth: 3,
    borderColor: colors.card,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  logoImage: { width: '100%', height: '100%' },
  // Clears the half of the logo that hangs below the banner.
  body: { paddingHorizontal: space.lg, paddingTop: LOGO_SIZE / 2 + space.md, paddingBottom: space.md, gap: 6 },
  name: { fontSize: font.heading, fontWeight: weight.bold, color: colors.foreground },
  infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: space.sm },
  info: { fontSize: font.body, color: colors.mutedForeground, flexShrink: 1 },
  badge: { paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.full },
  badgeOpen: { backgroundColor: colors.successSoft },
  badgeClosed: { backgroundColor: colors.destructiveSoft },
  badgeText: { fontSize: font.small, fontWeight: weight.semibold },
  strip: { backgroundColor: colors.destructiveSoft, paddingHorizontal: space.lg, paddingVertical: space.md },
  stripText: { fontSize: font.body, fontWeight: weight.semibold, color: colors.destructive },
});
