import { Search } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { colors } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';

/** Placeholder until the search screen (Task 12) replaces it; the home search bar already leads here. */
export default function SearchPlaceholder() {
  const { t } = useTranslation();
  return (
    <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <EmptyState icon={<Search size={32} color={colors.primarySoftForeground} />} title={t('search.placeholderTitle')} body={t('search.placeholderBody')} />
    </View>
  );
}
