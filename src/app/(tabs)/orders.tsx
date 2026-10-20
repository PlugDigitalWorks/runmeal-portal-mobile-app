import { UtensilsCrossed } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { TabScreen } from '@/components/TabScreen';
import { colors } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';

/** Placeholder until the order history screen (Task 11) replaces it. */
export default function Orders() {
  const { t } = useTranslation();
  return (
    <TabScreen title={t('orders.title')}>
      <EmptyState icon={<UtensilsCrossed size={32} color={colors.primarySoftForeground} />} title={t('orders.placeholderTitle')} body={t('orders.placeholderBody')} />
    </TabScreen>
  );
}
