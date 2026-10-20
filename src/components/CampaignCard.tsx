import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Campaign } from '@/mocks/home-mocks';
import { colors, radius, space, weight } from '@/theme';

type Props = { campaign: Campaign; /** Fixed width inside the horizontal row; omit to fill the list width. */ width?: number };

/** Mock campaign card: warm colour block, white title and subtitle, a big icon bottom right. No image files. */
export function CampaignCard({ campaign, width }: Props) {
  const { t } = useTranslation();
  const Icon = campaign.icon;
  return (
    <Pressable
      style={[styles.card, { backgroundColor: campaign.color }, width ? { width } : null]}
      onPress={() => router.push({ pathname: '/campaigns/[id]', params: { id: campaign.id } })}
      accessibilityRole="button"
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{t(`campaigns.items.${campaign.id}.badge`)}</Text>
      </View>
      <Text style={styles.title} numberOfLines={3}>
        {t(`campaigns.items.${campaign.id}.title`)}
      </Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {t(`campaigns.items.${campaign.id}.subtitle`)}
      </Text>
      <View style={styles.icon}>
        <Icon size={44} color={colors.primaryForeground} strokeWidth={1.5} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { height: 150, borderRadius: radius.lg, padding: space.lg, gap: 4, overflow: 'hidden' },
  badge: { alignSelf: 'flex-start', paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 12, fontWeight: weight.bold, color: colors.primaryForeground },
  title: { fontSize: 20, fontWeight: weight.bold, color: colors.primaryForeground, maxWidth: '85%' },
  subtitle: { fontSize: 13, color: colors.primaryForeground, opacity: 0.9, maxWidth: '75%' },
  icon: { position: 'absolute', right: space.lg, bottom: space.lg },
});
