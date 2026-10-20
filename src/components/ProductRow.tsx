import { Image } from 'expo-image';
import { Plus, ThumbsUp } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { isDiscounted } from '@/lib/menu-picks';
import { formatMoney } from '@/lib/money';
import { mockProductLike } from '@/mocks/restaurant-mocks';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import type { MenuProduct } from '@/types/product';
import { MockTag } from '@/ui/MockTag';

const PHOTO = 104;

type Props = { product: MenuProduct; onPress: () => void };

/**
 * One menu line, the widest thing on the page: name, two-line description, price (sale price in the promo
 * colour with the old one struck through) and the mock "liked" line on the left; a 104 px photo with a white
 * round add button on the right. Tapping the row or the button opens the product sheet.
 */
export function ProductRow({ product, onPress }: Props) {
  const { t } = useTranslation();
  const price = (value: number | null) => formatMoney(value, product.currency, { symbol: product.currencySymbol });
  const sale = isDiscounted(product);
  const like = SHOW_MOCKS ? mockProductLike(product.id) : null;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primarySoft }]}>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
        <View style={styles.prices}>
          {sale ? (
            <>
              <Text style={styles.sale}>{price(product.discountedPrice)}</Text>
              <Text style={styles.original}>{price(product.price)}</Text>
            </>
          ) : (
            <Text style={styles.price}>{price(product.price)}</Text>
          )}
        </View>
        {like ? (
          <View style={styles.like}>
            <ThumbsUp size={14} color={colors.primarySoftForeground} fill={colors.primarySoftForeground} />
            <Text style={styles.likeText}>{t('restaurant.liked', like)}</Text>
            <MockTag />
          </View>
        ) : null}
      </View>
      <View style={styles.photo}>
        {product.imageUrl ? <Image source={{ uri: product.imageUrl }} contentFit="cover" cachePolicy="memory-disk" transition={150} style={styles.image} /> : null}
        <View style={styles.add} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Plus size={18} color={colors.foreground} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md, paddingVertical: space.md + 2, marginHorizontal: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  body: { flex: 1, gap: 4 },
  name: { fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
  description: { fontSize: font.body, color: colors.mutedForeground, lineHeight: 19 },
  prices: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: 2 },
  price: { fontSize: 15, fontWeight: weight.bold, color: colors.foreground },
  sale: { fontSize: 15, fontWeight: weight.bold, color: colors.promo },
  original: { fontSize: font.body, color: colors.subtle, textDecorationLine: 'line-through' },
  like: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  likeText: { fontSize: font.small, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  photo: { width: PHOTO, height: PHOTO, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bannerPlaceholder },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.lg - 1 },
  add: { position: 'absolute', right: 6, bottom: 6, width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
});
