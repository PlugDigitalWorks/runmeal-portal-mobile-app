import { router } from 'expo-router';
import { ChevronDown, MapPin, User as UserIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { addressLabel } from '@/lib/address';
import { colors, radius, space, weight } from '@/theme';

type Props = { onOpenAddress: () => void };

const SLOT = 32;

/**
 * Minimal Uber-style top row: a small outlined address pill, centred on the screen, and a round
 * profile button on the right. The empty left slot is as wide as the button so the pill stays centred.
 */
export function HomeHeader({ onOpenAddress }: Props) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { activeAddress } = useLocation();
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={styles.row}>
      <View style={styles.slot} />
      <View style={styles.center}>
        <Pressable onPress={onOpenAddress} style={[styles.address, { maxWidth: width * 0.55 }]} accessibilityRole="button" testID="home-address">
          <MapPin size={13} color={colors.primary} fill={colors.primary} />
          <View style={styles.text}>
            <Text style={styles.deliverTo}>{t('home.deliverTo')}</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {activeAddress ? addressLabel(activeAddress) : ''}
            </Text>
          </View>
          <ChevronDown size={12} color={colors.foreground} />
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/account')} style={[styles.slot, styles.profile]} accessibilityRole="button" accessibilityLabel={t('account.title')}>
        {initials ? <Text style={styles.initials}>{initials}</Text> : <UserIcon size={16} color={colors.foreground} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // The screen keeps the list below the status bar; 52 tall; the side slots keep the same width so the pill is exactly centred.
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingBottom: space.sm },
  slot: { width: SLOT, height: SLOT },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 44 },
  address: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.foreground,
    backgroundColor: colors.card,
  },
  text: { flexShrink: 1 },
  deliverTo: { fontSize: 9, lineHeight: 11, color: colors.mutedForeground },
  addressText: { fontSize: 12, lineHeight: 15, fontWeight: weight.semibold, color: colors.foreground },
  profile: { borderRadius: radius.full, backgroundColor: colors.searchFill, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 12, fontWeight: weight.bold, color: colors.foreground },
});
