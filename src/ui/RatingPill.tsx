import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, weight } from '@/theme';

type Props = { rating: number; count: number; size?: 'sm' | 'md' };

const LOGO = require('../../assets/logo.png');

/**
 * White rating pill in Runmeal colours: the small logo where other apps put a star, "4.8" and a grey
 * "(1500+)". `sm` is for tiles and cards, `md` for the restaurant page. Rating and count are mock values
 * wherever the API has none, so the screen that shows it carries the "(Mock)" label.
 */
export function RatingPill({ rating, count, size = 'sm' }: Props) {
  const md = size === 'md';
  return (
    <View style={[styles.pill, md && styles.pillMd]}>
      <Image source={LOGO} contentFit="contain" style={md ? styles.logoMd : styles.logo} />
      <Text style={[styles.rating, md && styles.ratingMd]}>
        {rating.toFixed(1)}
        <Text style={[styles.count, md && styles.countMd]}>{` (${count}+)`}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 7,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    opacity: 0.97,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  pillMd: { height: 26, paddingHorizontal: 9, gap: 5 },
  logo: { width: 12, height: 12 },
  logoMd: { width: 14, height: 14 },
  rating: { fontSize: 12, fontWeight: weight.bold, color: colors.foreground },
  ratingMd: { fontSize: 14 },
  count: { fontSize: 11, fontWeight: '500', color: colors.mutedForeground },
  countMd: { fontSize: 12 },
});
