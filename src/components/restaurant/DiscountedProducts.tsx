import { Image } from 'expo-image';
import { BadgePercent, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { discountPercent } from '@/lib/menu-picks';
import { formatMoney } from '@/lib/money';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import type { MenuProduct } from '@/types/product';
import { RAIL_CARD_WIDTH } from './PopularProducts';

const PICTURE = RAIL_CARD_WIDTH - 2 * space.sm;

type Props = { products: MenuProduct[]; onPress: (product: MenuProduct) => void };

/** Real discounts only (Getir's "Special offers"): sale price in the promo colour, the old price struck through and the percent off. */
export function DiscountedProducts({ products, onPress }: Props) {
  const { t } = useTranslation();
  if (products.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <BadgePercent size={22} color={colors.primaryForeground} />
        </View>
        <Text style={styles.title}>{t('restaurant.discounted')}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {products.map((product) => (
          <Pressable key={product.id} onPress={() => onPress(product)} accessibilityRole="button" style={styles.card}>
            <View style={styles.picture}>
              {product.imageUrl ? <Image source={{ uri: product.imageUrl }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={StyleSheet.absoluteFill} /> : null}
              <View style={styles.add}>
                <Plus size={18} color={colors.foreground} />
              </View>
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
            <View style={styles.prices}>
              <Text style={styles.sale}>{formatMoney(product.discountedPrice, product.currency, { symbol: product.currencySymbol })}</Text>
              <Text style={styles.original}>{formatMoney(product.price, product.currency, { symbol: product.currencySymbol })}</Text>
            </View>
            <Text style={styles.percent}>{t('restaurant.percentOff', { percent: discountPercent(product) })}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg },
  badge: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.promo, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 20, fontWeight: weight.bold, color: colors.foreground },
  rail: { paddingHorizontal: space.lg, gap: space.md },
  card: { width: RAIL_CARD_WIDTH, padding: space.sm, gap: 4, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  picture: { width: PICTURE, height: PICTURE, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.bannerPlaceholder },
  add: { position: 'absolute', right: 6, bottom: 6, width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  name: { fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground, minHeight: 36, marginTop: 4 },
  prices: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', columnGap: 6 },
  sale: { fontSize: font.base - 1, fontWeight: weight.bold, color: colors.promo },
  original: { fontSize: font.small, color: colors.subtle, textDecorationLine: 'line-through' },
  percent: { fontSize: font.small, fontWeight: weight.semibold, color: colors.promo },
});
