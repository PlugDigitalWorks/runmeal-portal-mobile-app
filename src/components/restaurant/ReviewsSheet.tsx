import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mockReviews, restaurantRating } from '@/mocks/restaurant-mocks';
import { colors, font, radius, space, weight } from '@/theme';
import { MockTag } from '@/ui/MockTag';
import { ratingText } from './format';
import { RatingMark } from './RatingMark';

type Props = { visible: boolean; onClose: () => void; branchId: string };

/** Sample reviews behind the rating box. The API has no reviews yet, so the whole sheet is a mock and titled so. */
export function ReviewsSheet({ visible, onClose, branchId }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
  const { rating, count } = restaurantRating(branchId);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{`${t('restaurant.reviewsTitle')} (${t('common.mock')})`}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
            <Text style={styles.close}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summary}>
            <RatingMark size={24} />
            <Text style={styles.score}>{ratingText(rating, lang)}</Text>
            <Text style={styles.count}>{count >= 100 ? `${count}+` : count}</Text>
          </View>
          {mockReviews(branchId).map((review) => (
            <View key={review.id} style={styles.review}>
              <View style={styles.reviewHead}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{review.author.charAt(0)}</Text>
                </View>
                <View style={styles.author}>
                  <Text style={styles.authorName}>{review.author}</Text>
                  <Text style={styles.ago}>{t('restaurant.reviewsDaysAgo', { count: review.daysAgo })}</Text>
                </View>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <RatingMark key={n} size={14} dim={n > review.rating} />
                  ))}
                </View>
              </View>
              <Text style={styles.text}>{t(`restaurant.reviewItem${review.textIndex}`)}</Text>
              <View style={styles.tag}>
                <MockTag />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.xl },
  title: { fontSize: font.heading, fontWeight: weight.bold, color: colors.foreground },
  close: { fontSize: font.base, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.md },
  summary: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingBottom: space.sm },
  score: { fontSize: font.display, fontWeight: weight.bold, color: colors.foreground },
  count: { fontSize: font.base, color: colors.mutedForeground },
  review: { gap: space.sm, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: font.base, fontWeight: weight.bold, color: colors.primarySoftForeground },
  author: { flex: 1 },
  authorName: { fontSize: font.body, fontWeight: weight.semibold, color: colors.foreground },
  ago: { fontSize: font.small, color: colors.subtle },
  stars: { flexDirection: 'row', gap: 1 },
  text: { fontSize: font.body, color: colors.foreground, lineHeight: 20 },
  tag: { flexDirection: 'row' },
});
