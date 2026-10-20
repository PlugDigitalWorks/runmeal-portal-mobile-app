import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { PhotoImage } from '@/components/PhotoImage';
import { hashId, type Chain } from '@/mocks/home-mocks';
import { colors, font, radius, space, weight } from '@/theme';

const SIZE = 72;

/**
 * Chain restaurants as Instagram-style stories (mock: the brand names are a guess from the branch names):
 * the picture itself is the circle, filled edge to edge, inside a 2px orange ring with a 2px gap. The
 * picture is the chain's logo, else a branch banner, else a placeholder food photo. A tap opens the
 * nearest branch.
 */
export function ChainStories({ chains }: { chains: Chain[] }) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{`${t('home.chains')} (${t('common.mock')})`}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('home.chains')}
        data={chains}
        keyExtractor={(c) => c.slug}
        contentContainerStyle={styles.row}
        renderItem={({ item }) => {
          const uri = item.logoUrl ?? item.bannerUrl;
          return (
            <Pressable
              style={styles.item}
              onPress={() => router.push({ pathname: '/restaurant/[branchId]', params: { branchId: item.nearest.id } })}
              accessibilityRole="button"
              accessibilityLabel={item.name}
            >
              <View style={styles.ring}>
                {uri ? (
                  <Image source={{ uri }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={styles.photo} />
                ) : (
                  <PhotoImage seed={hashId(item.slug) % 100} width={160} height={160} style={styles.photo} />
                )}
              </View>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: space.md },
  title: { paddingHorizontal: space.lg, paddingTop: space.md, paddingBottom: space.sm, fontSize: font.small, fontWeight: weight.semibold, color: colors.mutedForeground },
  row: { paddingHorizontal: space.lg, gap: space.md },
  item: { width: 80, alignItems: 'center', gap: 6 },
  // 72 picture + 2px gap + 2px orange border on every side = 80.
  ring: { width: SIZE + 8, height: SIZE + 8, borderRadius: radius.full, borderWidth: 2, borderColor: colors.primary, padding: 2 },
  photo: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: 'hidden', backgroundColor: colors.bannerPlaceholder },
  name: { maxWidth: 76, fontSize: font.caption, fontWeight: weight.semibold, color: colors.foreground },
});
