import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';
import { CampaignArt } from '@/components/CampaignArt';
import type { Campaign } from '@/mocks/home-mocks';

export const CAMPAIGN_ART_HEIGHT = 170;

type Props = { campaign: Campaign; /** Fixed width inside the horizontal row; omit to fill the list width. */ width?: number };

/** A tappable campaign poster; the poster artwork is CampaignArt, the title is its accessible name. */
export function CampaignCard({ campaign, width }: Props) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/campaigns/[id]', params: { id: campaign.id } })}
      accessibilityRole="button"
      accessibilityLabel={t(`campaigns.items.${campaign.id}.title`)}
    >
      <CampaignArt campaign={campaign} width={width} height={CAMPAIGN_ART_HEIGHT} />
    </Pressable>
  );
}
