import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/ui/Screen';

/** Placeholder until the home feed lands. */
export default function Home() {
  const { t } = useTranslation();
  return (
    <Screen padded>
      <Text>{t('tabs.home')}</Text>
    </Screen>
  );
}
