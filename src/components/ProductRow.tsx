import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, shadow, space, weight } from '@/theme';
import type { MenuProduct } from '@/types/product';
import { Price } from '@/ui/Price';

type Props = { product: MenuProduct; onPress: () => void };

/** One menu line: name, two-line description and price on the left, square photo with the add button on the right. */
export function ProductRow({ product, onPress }: Props) {
  const original = product.discountedPrice != null && Number(product.discountedPrice) < Number(product.price) ? Number(product.price) : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.primarySoft }]}
    >
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        {product.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        ) : null}
        <Price value={product.discountedPrice ?? product.price} original={original} currency={product.currency} size="sm" />
      </View>
      <View style={styles.photo}>
        {product.imageUrl ? <Image source={{ uri: product.imageUrl }} contentFit="cover" transition={150} style={styles.image} /> : null}
        <View style={styles.add}>
          <Plus size={16} color={colors.foreground} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, paddingHorizontal: space.lg },
  body: { flex: 1, gap: 4 },
  name: { fontSize: font.base - 1, fontWeight: weight.semibold, color: colors.foreground },
  description: { fontSize: font.small, color: colors.mutedForeground, lineHeight: 16 },
  photo: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.bannerPlaceholder },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: radius.md },
  add: {
    position: 'absolute',
    right: 6,
    bottom: 6,
    width: 30,
    height: 30,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
});
