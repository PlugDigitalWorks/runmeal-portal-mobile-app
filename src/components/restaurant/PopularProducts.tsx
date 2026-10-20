import { Image } from 'expo-image';
import { Flame, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatMoney } from '@/lib/money';
import { colors, font, radius, space, weight } from '@/theme';
import type { MenuProduct } from '@/types/product';

export const RAIL_CARD_WIDTH = 150;
const PICTURE = RAIL_CARD_WIDTH - 2 * space.sm;

type Props = {
  products: MenuProduct[];
  /** True when the list is a stand-in (no best-seller tags): the title then says "(Mock)". */
  mocked: boolean;
  onPress: (product: MenuProduct) => void;
};

/** "Popüler lezzetler" (Yemeksepeti): an orange flame, a headline and a rail of ranked product cards. */
export function PopularProducts({ products, mocked, onPress }: Props) {
  const { t } = useTranslation();
  if (products.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.flame}>
          <Flame size={22} color={colors.primaryForeground} />
        </View>
        <View style={styles.titles}>
          <Text style={styles.title}>{mocked ? `${t('restaurant.popular')} (${t('common.mock')})` : t('restaurant.popular')}</Text>
          <Text style={styles.sub}>{t('restaurant.popularSub')}</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        {products.map((product, index) => (
          <Pressable key={product.id} onPress={() => onPress(product)} accessibilityRole="button" style={styles.card}>
            <View style={styles.picture}>
              {product.imageUrl ? <Image source={{ uri: product.imageUrl }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={StyleSheet.absoluteFill} /> : null}
              <View style={styles.rank}>
                <Text style={styles.rankText}>{t('restaurant.popularRank', { rank: index + 1 })}</Text>
              </View>
            </View>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
            <View style={styles.bottom}>
              <Text style={styles.price}>{formatMoney(product.discountedPrice ?? product.price, product.currency, { symbol: product.currencySymbol })}</Text>
              <View style={styles.add}>
                <Plus size={18} color={colors.primaryForeground} />
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg },
  flame: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  titles: { flex: 1 },
  title: { fontSize: 20, fontWeight: weight.bold, color: colors.foreground },
  sub: { fontSize: font.body, color: colors.mutedForeground },
  rail: { paddingHorizontal: space.lg, gap: space.md },
  card: { width: RAIL_CARD_WIDTH, padding: space.sm, gap: space.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  picture: { width: PICTURE, height: PICTURE, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.bannerPlaceholder },
  rank: { position: 'absolute', top: 6, left: 6, paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.primary },
  rankText: { fontSize: font.caption, fontWeight: weight.bold, color: colors.primaryForeground },
  name: { fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground, minHeight: 36 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { flexShrink: 1, fontSize: font.body, fontWeight: weight.bold, color: colors.foreground },
  add: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
