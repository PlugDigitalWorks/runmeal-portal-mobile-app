import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Gift } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { campaignById } from '@/mocks/home-mocks';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

/** Detail of one (mock) campaign: colour block, description and a clear "sample" note. */
export default function CampaignDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaign = campaignById(id);

  if (!campaign) {
    return (
      <View style={styles.center}>
        <EmptyState icon={<Gift size={32} color={colors.primarySoftForeground} />} title={t('campaigns.notFound')} />
      </View>
    );
  }
  const Icon = campaign.icon;
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: t('campaigns.title') }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.hero, { backgroundColor: campaign.color }]}>
          <Icon size={56} color={colors.primaryForeground} strokeWidth={1.5} />
          <Text style={styles.heroTitle}>{t(`campaigns.items.${campaign.id}.title`)}</Text>
          <Text style={styles.heroSubtitle}>{t(`campaigns.items.${campaign.id}.subtitle`)}</Text>
        </View>
        <Text style={styles.description}>{t(`campaigns.items.${campaign.id}.description`)}</Text>
        <Text style={styles.note}>{t('campaigns.mockNote')}</Text>
        <Button title={t('cart.browse')} onPress={() => router.navigate('/(tabs)')} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg },
  hero: { borderRadius: radius.lg, padding: space.xl, gap: space.sm, minHeight: 200, justifyContent: 'flex-end' },
  heroTitle: { fontSize: font.display, fontWeight: weight.bold, color: colors.primaryForeground },
  heroSubtitle: { fontSize: font.base, color: colors.primaryForeground, opacity: 0.9 },
  description: { fontSize: font.base, lineHeight: 24, color: colors.foreground },
  note: { fontSize: font.body, color: colors.mutedForeground },
});
