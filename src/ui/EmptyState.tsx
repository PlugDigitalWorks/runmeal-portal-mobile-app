import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from './Button';

type Props = { icon: ReactNode; title: string; body?: string; actionLabel?: string; onAction?: () => void };

/** Centered placeholder for empty lists: soft circle icon, title, optional body and one action. */
export function EmptyState({ icon, title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.circle}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <View style={styles.action}>
          <Button title={actionLabel} onPress={onAction} />
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
  title: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground, textAlign: 'center' },
  body: { fontSize: font.body, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  action: { marginTop: space.sm, alignSelf: 'stretch' },
});
