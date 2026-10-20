import { MapPin, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { mapsUrl, slotsText, WEEK_DAYS, weekDayOf } from '@/lib/branch-model';
import { colors, font, radius, space, weight } from '@/theme';
import type { BranchDetail, BusinessHours } from '@/types/branch';

type Props = { visible: boolean; onClose: () => void; branch: BranchDetail; hours: BusinessHours | undefined };

/** Address, phone, the weekly timetable (today in bold) and a link that opens the restaurant in the maps app. All real data. */
export function RestaurantInfoSheet({ visible, onClose, branch, hours }: Props) {
  const { t } = useTranslation();
  const today = weekDayOf();
  const openMaps = () => Linking.openURL(mapsUrl(branch, Platform.OS)).catch(() => undefined);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('restaurant.infoTitle')}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
            <Text style={styles.close}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.name}>{branch.name}</Text>
          {branch.addressText ? (
            <View style={styles.block}>
              <Text style={styles.label}>{t('restaurant.address')}</Text>
              <Text style={styles.value}>{branch.addressText}</Text>
            </View>
          ) : null}
          {branch.phone ? (
            <Pressable style={styles.block} onPress={() => Linking.openURL(`tel:${branch.phone}`).catch(() => undefined)} accessibilityRole="link">
              <Text style={styles.label}>{t('restaurant.phone')}</Text>
              <View style={styles.inline}>
                <Phone size={16} color={colors.primarySoftForeground} />
                <Text style={styles.link}>{branch.phone}</Text>
              </View>
            </Pressable>
          ) : null}
          {hours && Object.keys(hours).length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.label}>{t('restaurant.hours')}</Text>
              {WEEK_DAYS.map((day) => {
                const entry = hours[day];
                const text = !entry?.isOpen ? t('restaurant.hoursClosed') : (slotsText(entry) ?? t('restaurant.hoursAllDay'));
                const bold = day === today;
                return (
                  <View key={day} style={styles.hoursRow} testID={`hours-${day}`}>
                    <Text style={[styles.day, bold && styles.bold]}>{t(`restaurant.days.${day}`)}</Text>
                    <Text style={[styles.slots, bold && styles.bold]}>{text}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
          <Pressable style={styles.maps} onPress={openMaps} accessibilityRole="link">
            <MapPin size={18} color={colors.primaryForeground} />
            <Text style={styles.mapsText}>{t('restaurant.openMaps')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.xl },
  title: { fontSize: font.heading, fontWeight: weight.bold, color: colors.foreground },
  close: { fontSize: font.base, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  content: { paddingHorizontal: space.xl, paddingBottom: space.xxl, gap: space.lg },
  name: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  block: { gap: 6 },
  label: { fontSize: font.small, fontWeight: weight.semibold, color: colors.subtle, textTransform: 'uppercase' },
  value: { fontSize: font.base, color: colors.foreground },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  link: { fontSize: font.base, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  day: { fontSize: font.base, color: colors.mutedForeground },
  slots: { fontSize: font.base, color: colors.foreground },
  bold: { fontWeight: weight.bold, color: colors.foreground },
  maps: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, borderRadius: radius.lg, backgroundColor: colors.primary },
  mapsText: { fontSize: font.base, fontWeight: weight.bold, color: colors.primaryForeground },
});
