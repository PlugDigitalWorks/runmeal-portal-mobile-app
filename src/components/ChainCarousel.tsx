import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Store } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Chain } from '@/mocks/home-mocks';
import { colors, font, radius, space, weight } from '@/theme';

/** Brands with several nearby branches: logo, a guessed brand name and the branch count; a tap opens the nearest branch. */
export function ChainCarousel({ chains }: { chains: Chain[] }) {
  const { t } = useTranslation();
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={chains}
      keyExtractor={(c) => c.slug}
      contentContainerStyle={styles.row}
      renderItem={({ item }) => (
        <Pressable
          style={styles.item}
          onPress={() => router.push({ pathname: '/restaurant/[branchId]', params: { branchId: item.nearest.id } })}
          accessibilityRole="button"
        >
          <View style={styles.logo}>
            {item.logoUrl ? <Image source={{ uri: item.logoUrl }} contentFit="contain" style={styles.logoImage} /> : <Store size={28} color={colors.primarySoftForeground} />}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.count}>{t('home.chainBranches', { count: item.branchCount })}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.lg, gap: space.lg },
  item: { width: 88, alignItems: 'center', gap: 4 },
  logo: { width: 76, height: 76, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: 56, height: 56 },
  name: { fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground, textAlign: 'center' },
  count: { fontSize: font.small, color: colors.mutedForeground },
});
