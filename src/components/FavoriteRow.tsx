import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Heart, Store } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FavoriteBranch } from '@/lib/favorites';
import { colors, font, radius, space, weight } from '@/theme';

type Props = { branch: FavoriteBranch; onRemove: () => void };

/** Compact line for the Favorilerim tab: thumbnail, name, address and the filled heart that removes it. */
export function FavoriteRow({ branch, onRemove }: Props) {
  const { t } = useTranslation();
  const image = branch.logoUrl ?? branch.bannerUrls?.[0] ?? null;
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/restaurant/[branchId]', params: { branchId: branch.id } })}
      accessibilityRole="button"
    >
      <View style={styles.thumb}>
        {image ? <Image source={{ uri: image }} contentFit="cover" style={StyleSheet.absoluteFill} /> : <Store size={24} color={colors.primarySoftForeground} />}
      </View>
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {branch.name}
        </Text>
        {branch.addressText ? (
          <Text style={styles.address} numberOfLines={1}>
            {branch.addressText}
          </Text>
        ) : null}
      </View>
      <Pressable onPress={onRemove} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('home.removeFavorite')}>
        <Heart size={22} color={colors.primary} fill={colors.primary} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  thumb: { width: 56, height: 56, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  name: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  address: { fontSize: 13, color: colors.mutedForeground },
});
