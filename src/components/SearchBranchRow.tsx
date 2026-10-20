import { Image } from 'expo-image';
import { ChevronRight, Store } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDistance, isOpenNow } from '@/lib/branch-model';
import { colors, font, radius, space, weight } from '@/theme';
import type { Branch } from '@/types/branch';

const LOGO = 48;

type Props = { branch: Branch; onPress: () => void };

/** One restaurant in the search results: round logo, name and a grey distance line (greyed out when closed). */
export function SearchBranchRow({ branch, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const open = isOpenNow(branch.business_hour);
  const info = [formatDistance(branch.distanceM, i18n.language === 'tr' ? 'tr' : 'en'), open ? '' : t('home.closed')].filter(Boolean).join(' · ');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, !open && styles.closed, pressed && { backgroundColor: colors.primarySoft }]}>
      <View style={styles.logo}>
        {branch.logoUrl ? <Image source={{ uri: branch.logoUrl }} contentFit="cover" cachePolicy="memory-disk" style={StyleSheet.absoluteFill} /> : <Store size={20} color={colors.primarySoftForeground} />}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {branch.name}
        </Text>
        {info ? (
          <Text style={styles.info} numberOfLines={1}>
            {info}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={18} color={colors.subtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, marginHorizontal: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  closed: { opacity: 0.55 },
  logo: { width: LOGO, height: LOGO, borderRadius: radius.full, overflow: 'hidden', backgroundColor: colors.bannerPlaceholder, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  name: { fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
  info: { fontSize: font.body, color: colors.mutedForeground },
});
