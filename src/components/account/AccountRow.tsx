import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, space, weight } from '@/theme';
import { MockTag } from '@/ui/MockTag';

type Props = {
  icon: LucideIcon;
  title: string;
  /** Plain text on the right, before the chevron (the current language). */
  value?: string;
  /** Orange pill after the title ("YENİ"). */
  badge?: string;
  /** The destination is demo data: the row carries a MockTag. */
  mock?: boolean;
  /** No chevron: the row acts at once (sign out). */
  hideChevron?: boolean;
  onPress: () => void;
  testID?: string;
};

/** One line of the account list: 22px icon, 16/500 title, optional value, tag or badge, chevron. */
export function AccountRow({ icon: Icon, title, value, badge, mock, hideChevron, onPress, testID }: Props) {
  return (
    <Pressable onPress={onPress} testID={testID} accessibilityRole="button" style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Icon size={22} color={colors.foreground} strokeWidth={1.8} />
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        {mock ? <MockTag /> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {hideChevron ? null : <ChevronRight size={18} color={colors.subtle} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.lg, minHeight: 56, paddingHorizontal: space.lg, backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  pressed: { backgroundColor: colors.primarySoft },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flexShrink: 1, fontSize: font.base, fontWeight: '500', color: colors.foreground },
  value: { fontSize: font.body, color: colors.mutedForeground },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full, backgroundColor: colors.primary },
  badgeText: { fontSize: font.caption, fontWeight: weight.bold, color: colors.primaryForeground },
});
