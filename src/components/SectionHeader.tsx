import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space, weight } from '@/theme';

type Props = { title: string; icon?: ReactNode; mock?: boolean; onSeeAll?: () => void; trailing?: string };

/** Section title (20/700) with an optional "see all" link; `mock` appends "(Mock)" so demo sections are always labelled. */
export function SectionHeader({ title, icon, mock, onSeeAll, trailing }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <View style={styles.title}>
        {icon}
        <Text style={styles.text} accessibilityRole="header" numberOfLines={1}>
          {mock ? `${title} (${t('common.mock')})` : title}
        </Text>
      </View>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} hitSlop={8} accessibilityRole="button">
          <Text style={styles.link}>{t('common.seeAll')}</Text>
        </Pressable>
      ) : trailing ? (
        <Text style={styles.count}>{trailing}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.md, paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  text: { flexShrink: 1, fontSize: 20, fontWeight: weight.bold, color: colors.foreground },
  link: { fontSize: 15, fontWeight: weight.semibold, color: colors.foreground },
  count: { fontSize: 14, color: colors.mutedForeground },
});
