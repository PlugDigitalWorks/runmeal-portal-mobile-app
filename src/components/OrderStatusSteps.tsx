import { Check } from 'lucide-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { isFinal, ORDER_STEPS, stepIndex } from '@/lib/order-status';
import { colors, font, radius, weight } from '@/theme';

const DOT = 24;

/** Dot of the step being worked on: a ring that fades in and out so a waiting person sees the order is alive. */
function PulsingDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 800 }), withTiming(1, { duration: 800 })), -1);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View testID="step-active" style={[styles.dot, styles.dotActive, style]}>
      <View style={styles.dotCore} />
    </Animated.View>
  );
}

/**
 * Five-step vertical timeline. Done steps are filled, the current one rings and pulses, the rest are grey.
 * A final order (delivered) has nothing left to wait for, so its last step reads as done, not pulsing.
 */
export function OrderStatusSteps({ status }: { status: string }) {
  const { t } = useTranslation();
  const current = stepIndex(status);
  const finished = isFinal(status);
  return (
    <View style={styles.wrap} accessibilityRole="list">
      {ORDER_STEPS.map((step, index) => {
        const done = index < current || (finished && index === current);
        const active = index === current && !finished;
        const last = index === ORDER_STEPS.length - 1;
        return (
          <View key={step} style={styles.row} accessibilityLabel={t(`orderStatus.${step}`)}>
            <View style={styles.rail}>
              {active ? (
                <PulsingDot />
              ) : (
                <View style={[styles.dot, done ? styles.dotDone : styles.dotPending]}>{done ? <Check size={14} color={colors.primaryForeground} strokeWidth={3} /> : null}</View>
              )}
              {last ? null : <View style={[styles.line, index < current && styles.lineDone]} />}
            </View>
            <Text style={[styles.label, active && styles.labelActive, !done && !active && styles.labelPending]}>{t(`orderStatus.${step}`)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 4 },
  row: { flexDirection: 'row', gap: 14, minHeight: 44 },
  rail: { alignItems: 'center', width: DOT },
  dot: { width: DOT, height: DOT, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: colors.primary },
  dotPending: { borderWidth: 2, borderColor: colors.border, backgroundColor: colors.card },
  dotActive: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.card },
  dotCore: { width: 10, height: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  line: { flex: 1, width: 2, marginVertical: 2, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.primary },
  label: { flex: 1, fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground, paddingTop: 2 },
  labelActive: { fontWeight: weight.bold, color: colors.primarySoftForeground },
  labelPending: { color: colors.subtle, fontWeight: weight.regular },
});
