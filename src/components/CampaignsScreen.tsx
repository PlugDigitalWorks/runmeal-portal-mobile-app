import { Gift } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CampaignCard } from '@/components/CampaignCard';
import { TabScreen } from '@/components/TabScreen';
import { SHOW_MOCKS } from '@/config';
import { CAMPAIGNS } from '@/mocks/home-mocks';
import { colors, space } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';

/** The Kampanyalar tab. The API has no campaigns, so the list is mock (and labelled so); with mocks off it is an empty state. */
export function CampaignsScreen() {
  const { t } = useTranslation();
  if (!SHOW_MOCKS) {
    return (
      <TabScreen title={t('campaigns.title')}>
        <EmptyState icon={<Gift size={32} color={colors.primarySoftForeground} />} title={t('campaigns.emptyTitle')} />
      </TabScreen>
    );
  }
  return (
    <TabScreen title={`${t('home.campaigns', { count: CAMPAIGNS.length })} (${t('common.mock')})`}>
      <ScrollView contentContainerStyle={styles.list}>
        {CAMPAIGNS.map((campaign) => (
          <View key={campaign.id}>
            <CampaignCard campaign={campaign} />
          </View>
        ))}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.md },
});
