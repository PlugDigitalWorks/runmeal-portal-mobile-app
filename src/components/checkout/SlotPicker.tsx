import { ScrollView, StyleSheet, View } from 'react-native';
import { formatSlotDay } from '@/lib/checkout';
import { space } from '@/theme';
import { Chip } from '@/ui/Chip';
import type { FulfillmentSlotsResponse } from '@/types/order';

type Props = {
  dates: FulfillmentSlotsResponse['dates'];
  lang: 'tr' | 'en';
  day: string | undefined;
  slot: string | null;
  onDay: (day: string) => void;
  onSlot: (day: string, value: string) => void;
};

/** Day chips on one row, the chosen day's times underneath. A slot's `value` is the backend's own string and goes out untouched. */
export function SlotPicker({ dates, lang, day, slot, onDay, onSlot }: Props) {
  const current = dates.find((d) => d.date === day) ?? dates[0];
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {dates.map((d) => (
          <Chip key={d.date} label={formatSlotDay(d.date, lang)} selected={d.date === current?.date} onPress={() => onDay(d.date)} />
        ))}
      </ScrollView>
      <View style={styles.grid}>
        {current?.slots.map((s) => (
          <Chip key={s.value} label={s.label} selected={s.value === slot} onPress={() => onSlot(current.date, s.value)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  row: { gap: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
