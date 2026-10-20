import { FlatList, StyleSheet } from 'react-native';
import { CampaignCard } from '@/components/CampaignCard';
import { CAMPAIGNS } from '@/mocks/home-mocks';
import { space } from '@/theme';

export const CAMPAIGN_CARD_WIDTH = 260;

/** Horizontal row of the (mock) campaign cards. */
export function CampaignCarousel() {
  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={CAMPAIGNS}
      keyExtractor={(c) => c.id}
      contentContainerStyle={styles.row}
      snapToInterval={CAMPAIGN_CARD_WIDTH + space.md}
      decelerationRate="fast"
      renderItem={({ item }) => <CampaignCard campaign={item} width={CAMPAIGN_CARD_WIDTH} />}
    />
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.lg, gap: space.md },
});
