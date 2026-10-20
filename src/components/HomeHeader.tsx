import { router, type Href } from 'expo-router';
import { ChevronDown, Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { addressLabel } from '@/lib/address';
import { colors, font, radius, space, weight } from '@/theme';

type Props = { onOpenAddress: () => void };

/**
 * Orange band of the home feed: delivery address picker, account avatar and the search entry.
 * The account and search tabs arrive in later tasks, so their hrefs are cast until the typed routes exist.
 */
export function HomeHeader({ onOpenAddress }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { activeAddress } = useLocation();
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <View style={[styles.band, { paddingTop: insets.top + space.md }]}>
      <View style={styles.top}>
        <Pressable onPress={onOpenAddress} style={styles.address} accessibilityRole="button" testID="home-address">
          <Text style={styles.deliverTo}>{t('home.deliverTo')}</Text>
          <View style={styles.addressRow}>
            <Text style={styles.addressText} numberOfLines={1}>
              {activeAddress ? addressLabel(activeAddress) : ''}
            </Text>
            <ChevronDown size={18} color={colors.primaryForeground} />
          </View>
        </Pressable>
        <Pressable
          onPress={() => router.push('/(tabs)/account' as Href)}
          style={styles.avatar}
          accessibilityRole="button"
          accessibilityLabel={t('home.profile')}
        >
          <Text style={styles.initials}>{initials}</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => router.push('/(tabs)/search' as Href)} style={styles.search} accessibilityRole="search">
        <Search size={18} color={colors.subtle} />
        <Text style={styles.placeholder}>{t('home.searchPlaceholder')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    gap: space.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  address: { flex: 1, gap: 2 },
  deliverTo: { fontSize: font.caption, color: colors.primarySoft },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { flexShrink: 1, fontSize: 15, fontWeight: weight.semibold, color: colors.primaryForeground },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: font.body, fontWeight: weight.bold, color: colors.primarySoftForeground },
  search: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.card,
  },
  placeholder: { fontSize: font.body, color: colors.subtle },
});
