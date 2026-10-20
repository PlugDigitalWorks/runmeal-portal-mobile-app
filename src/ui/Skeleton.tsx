import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';
import { colors, radius as radii, shadow, space } from '@/theme';

type Props = { width?: DimensionValue; height: number; radius?: number };

/** Pulsing placeholder block shown while a query loads. */
export function Skeleton({ width = '100%', height, radius = radii.sm }: Props) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: colors.bannerPlaceholder, opacity }} />
  );
}

/** Mirrors the home branch card (banner + text lines) so the list does not jump when data arrives. */
export function BranchCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton height={150} radius={0} />
      <View style={styles.body}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

/** Two half-visible compact cards, the loading look of a horizontal restaurant row. */
export function BranchCarouselSkeleton() {
  return (
    <View style={styles.row}>
      <View style={[styles.card, { width: 280 }]}>
        <Skeleton height={150} radius={0} />
        <View style={styles.body}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <View style={[styles.card, { width: 280 }]}>
        <Skeleton height={150} radius={0} />
        <View style={styles.body}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, paddingHorizontal: space.lg, overflow: 'hidden' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  body: { padding: space.md, gap: space.sm },
});
