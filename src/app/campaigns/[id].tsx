import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Gift } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CampaignArt } from '@/components/CampaignArt';
import { SHOW_MOCKS } from '@/config';
import { campaignById } from '@/mocks/home-mocks';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';

/** Detail of one (mock) campaign: the full-size poster, title, description and a clear "sample" note. */
export default function CampaignDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  // The campaigns are mock data: with mocks off the route behaves as if there were none.
  const campaign = SHOW_MOCKS ? campaignById(id) : undefined;

  if (!campaign) {
    return (
      <View style={styles.center}>
        <EmptyState icon={<Gift size={32} color={colors.primarySoftForeground} />} title={t('campaigns.notFound')} />
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <Stack.Screen options={{ title: t('campaigns.title') }} />
      <ScrollView contentContainerStyle={styles.content}>
        <CampaignArt campaign={campaign} height={220} />
        <Text style={styles.title}>{t(`campaigns.items.${campaign.id}.title`)}</Text>
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
  title: { fontSize: font.heading, fontWeight: weight.bold, color: colors.foreground },
  description: { fontSize: font.base, lineHeight: 24, color: colors.foreground },
  note: { fontSize: font.body, color: colors.mutedForeground },
});
