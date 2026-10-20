import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { useCountdown } from '@/hooks/useCountdown';
import { colors, radius, space } from '@/theme';
import { MockTag } from '@/ui/MockTag';

export const COUNTDOWN_HEIGHT = 56;

/** Minutes and seconds in two white boxes; labelled "14 dk : 47 sn" for screen readers and tests. */
export function CountdownClock() {
  const { t } = useTranslation();
  const { min, sec } = useCountdown();
  return (
    <View style={styles.clock} accessible accessibilityLabel={t('countdown.label', { min, sec })}>
      <View style={styles.box}>
        <Text style={styles.digits}>{min}</Text>
        <Text style={styles.unit}>{t('countdown.minutesShort')}</Text>
      </View>
      <Text style={styles.colon}>:</Text>
      <View style={styles.box}>
        <Text style={styles.digits}>{sec}</Text>
        <Text style={styles.unit}>{t('countdown.secondsShort')}</Text>
      </View>
    </View>
  );
}

/**
 * Orange strip pinned to the bottom of Keşfet, right above the tab bar (mock): a 15-minute countdown that
 * starts over at zero. A tap opens /deals, the X closes it for as long as the screen lives. The clock is
 * a shared store (lib/countdown), so a tick re-renders this strip, not the feed.
 */
export function CountdownStrip() {
  const { t } = useTranslation();
  const [closed, setClosed] = useState(false);
  if (!SHOW_MOCKS || closed) return null;
  return (
    <Pressable style={styles.strip} onPress={() => router.push('/deals')} accessibilityRole="button" accessibilityLabel={t('countdown.open')}>
      <CountdownClock />
      <Text style={styles.text} numberOfLines={2}>
        {t('countdown.text')}
      </Text>
      <View style={styles.tag}>
        <MockTag />
      </View>
      <Pressable style={styles.close} onPress={() => setClosed(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('common.close')}>
        <X size={14} color={colors.foreground} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: COUNTDOWN_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, backgroundColor: colors.primary },
  clock: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  box: { width: 36, height: 40, borderRadius: radius.sm, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  digits: { fontSize: 18, lineHeight: 20, fontWeight: '800', color: colors.foreground, fontVariant: ['tabular-nums'] },
  unit: { fontSize: 10, lineHeight: 11, fontWeight: '600', color: colors.foreground },
  colon: { fontSize: 16, fontWeight: '800', color: colors.primaryForeground },
  text: { flex: 1, fontSize: 14, lineHeight: 18, fontWeight: '600', color: colors.primaryForeground },
  tag: { position: 'absolute', right: space.md + 36, top: -9 },
  close: { width: 28, height: 28, borderRadius: radius.full, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
});
