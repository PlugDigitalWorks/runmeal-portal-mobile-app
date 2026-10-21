import { Construction } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';

/**
 * What a mock-only screen shows in a build without mocks. The menu hides these rows already;
 * this covers a deep link straight to the route, like the campaign detail does.
 */
export function NotAvailable() {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      <EmptyState icon={<Construction size={32} color={colors.primarySoftForeground} />} title={t('account.notAvailable')} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', backgroundColor: colors.background },
});
