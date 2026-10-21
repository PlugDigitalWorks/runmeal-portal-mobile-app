import { CircleAlert, UserX, WifiOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from './Button';

type Action = { title: string; onPress: () => void };

type Props = {
  onRetry?: () => void;
  message?: string;
  /** A second line under the message, e.g. the error code or what to do next. */
  body?: string;
  icon?: 'network' | 'account' | 'server';
  /** A way out that doesn't depend on the failing call, such as signing out. */
  secondaryAction?: Action;
};

const ICONS = { network: WifiOff, account: UserX, server: CircleAlert };

/** Shared failure view for every query: same icon and secondary retry button on each screen. */
export function ErrorState({ onRetry, message, body, icon = 'network', secondaryAction }: Props) {
  const { t } = useTranslation();
  const Icon = ICONS[icon];
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>
        <Icon size={28} color={colors.primarySoftForeground} />
      </View>
      <Text style={styles.message}>{message ?? t('errors.network')}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {onRetry ? (
        <View style={styles.action}>
          <Button variant="secondary" title={t('common.retry')} onPress={onRetry} />
        </View>
      ) : null}
      {secondaryAction ? (
        <View style={styles.action}>
          <Button variant="ghost" title={secondaryAction.title} onPress={secondaryAction.onPress} />
        </View>
      ) : null}
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
  body: { fontSize: font.body, color: colors.mutedForeground, textAlign: 'center' },
  action: { marginTop: space.sm, alignSelf: 'stretch' },
});
