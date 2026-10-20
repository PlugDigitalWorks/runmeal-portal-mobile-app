import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { radius, space, weight, colors } from '@/theme';
import type { Branch } from '@/types/branch';

const GAP = space.md;

/** Full-width paging banners of open restaurants that have a banner image; the parent skips the section when there are none. */
export function FeaturedCarousel({ branches }: { branches: Branch[] }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const cardWidth = width - space.lg * 2;
  const [index, setIndex] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP)));

  return (
    <View>
      <FlatList
        horizontal
        accessibilityLabel={t('home.featured')}
        showsHorizontalScrollIndicator={false}
        data={branches}
        keyExtractor={(b) => b.id}
        contentContainerStyle={styles.row}
        // Snaps by interval rather than pagingEnabled: the cards are narrower than the screen and separated by a gap.
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { width: cardWidth }]}
            onPress={() => router.push({ pathname: '/restaurant/[branchId]', params: { branchId: item.id } })}
            accessibilityRole="button"
            accessibilityLabel={item.name}
          >
            <Image source={{ uri: item.bannerUrls?.[0] ?? undefined }} contentFit="cover" style={StyleSheet.absoluteFill} />
            <View style={styles.strip}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
          </Pressable>
        )}
      />
      {branches.length > 1 ? (
        <View style={styles.dots}>
          {branches.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.lg, gap: GAP },
  card: { height: 160, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.bannerPlaceholder, justifyContent: 'flex-end' },
  strip: { backgroundColor: 'rgba(16,25,46,0.55)', paddingHorizontal: space.md, paddingVertical: space.sm },
  name: { fontSize: 16, fontWeight: weight.bold, color: colors.primaryForeground },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: space.sm },
  dot: { width: 6, height: 6, borderRadius: radius.full, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.foreground },
});
