import { WifiOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from './Button';

type Props = { onRetry: () => void; message?: string };

/** Shared failure view for every query: same icon and secondary retry button on each screen. */
export function ErrorState({ onRetry, message }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>
        <WifiOff size={28} color={colors.primarySoftForeground} />
      </View>
      <Text style={styles.message}>{message ?? t('errors.network')}</Text>
      <View style={styles.action}>
        <Button variant="secondary" title={t('common.retry')} onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  circle: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground, textAlign: 'center' },
  action: { marginTop: space.sm, alignSelf: 'stretch' },
});
