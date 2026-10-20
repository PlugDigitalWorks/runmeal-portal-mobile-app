import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { humanize, statusTone } from '@/lib/order-display';
import { colors, font, radius, weight } from '@/theme';

const TONES = {
  success: { backgroundColor: colors.successSoft, color: colors.success },
  danger: { backgroundColor: colors.destructiveSoft, color: colors.destructive },
  info: { backgroundColor: colors.primarySoft, color: colors.primarySoftForeground },
} as const;

/** Status as a tinted pill; a status the copy does not name falls back to its humanized API value. */
export function StatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const tone = TONES[statusTone(status)];
  return (
    <Text style={[styles.pill, { backgroundColor: tone.backgroundColor, color: tone.color }]}>
      {t(`orderStatus.${status.toUpperCase()}`, { defaultValue: humanize(status) })}
    </Text>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    fontSize: font.small,
    fontWeight: weight.bold,
  },
});
