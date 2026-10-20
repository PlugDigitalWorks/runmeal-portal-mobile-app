import { Image } from 'expo-image';
import { Award, ArrowLeft, Heart, Search, Share2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SHOW_MOCKS } from '@/config';
import { bannerOf } from '@/lib/branch-model';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import type { BranchDetail } from '@/types/branch';
import { MockTag } from '@/ui/MockTag';

/** Height of the picture itself; the status bar area is added on top because the picture runs under it. */
export const COVER_HEIGHT = 150;
/** How far the white title card climbs over the cover's bottom edge. */
export const COVER_OVERLAP = 24;
const BUTTON = 36;

type Props = {
  branch: Pick<BranchDetail, 'name' | 'bannerUrls' | 'logoUrl'>;
  favorite: boolean;
  /** Shows the "Runmeal Seçkin" badge; a mock (see home-mocks `isDistinguished`). */
  selected: boolean;
  onBack: () => void;
  onSearch: () => void;
  onToggleFavorite: () => void;
};

export function RoundButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={label} style={styles.button}>
      {children}
    </Pressable>
  );
}

/** Narrow cover (Yemeksepeti style): the picture under the status bar, white round buttons on it and the quality badge bottom-left. */
export function RestaurantHero({ branch, favorite, selected, onBack, onSearch, onToggleFavorite }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const banner = bannerOf(branch);

  return (
    <View style={[styles.cover, { height: COVER_HEIGHT + insets.top }]}>
      {banner ? <Image source={{ uri: banner }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={StyleSheet.absoluteFill} /> : null}
      <View style={styles.scrim} pointerEvents="none" />
      <View style={[styles.bar, { top: insets.top + space.sm }]}>
        <RoundButton label={t('restaurant.back')} onPress={onBack}>
          <ArrowLeft size={20} color={colors.foreground} />
        </RoundButton>
        <View style={styles.actions}>
          <RoundButton label={t('restaurant.search')} onPress={onSearch}>
            <Search size={18} color={colors.foreground} />
          </RoundButton>
          <RoundButton label={t(favorite ? 'home.removeFavorite' : 'home.addFavorite')} onPress={onToggleFavorite}>
            <Heart size={18} color={favorite ? colors.primary : colors.foreground} fill={favorite ? colors.primary : 'transparent'} />
          </RoundButton>
          <RoundButton label={t('restaurant.share')} onPress={() => Share.share({ message: branch.name }).catch(() => undefined)}>
            <Share2 size={18} color={colors.foreground} />
          </RoundButton>
        </View>
      </View>
      {SHOW_MOCKS && selected ? (
        <View style={styles.badge}>
          <Award size={14} color={colors.primarySoftForeground} />
          <Text style={styles.badgeText}>{t('restaurant.selected')}</Text>
          <MockTag />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { backgroundColor: colors.bannerPlaceholder },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(16,25,46,0.25)' },
  bar: { position: 'absolute', left: space.lg, right: space.lg, flexDirection: 'row', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: space.sm },
  button: { width: BUTTON, height: BUTTON, borderRadius: radius.full, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  badge: {
    position: 'absolute',
    left: space.lg,
    bottom: COVER_OVERLAP + space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: space.sm,
    paddingRight: 4,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
  badgeText: { fontSize: font.caption, fontWeight: weight.semibold, color: colors.foreground },
});
