import { ArrowDownWideNarrow, Check, SlidersHorizontal } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { useHomeView } from '@/context/HomeViewContext';
import { activeFilterCount, NO_FILTERS, type HomeFilters, type HomeSort } from '@/lib/home-filters';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from '@/ui/Button';

const SORTS: { id: HomeSort; mock?: boolean }[] = [
  { id: 'recommended' },
  { id: 'nearest' },
  { id: 'topRated', mock: true },
  { id: 'fastest', mock: true },
];
const SWITCHES: { id: keyof HomeFilters; mock?: boolean }[] = [
  { id: 'openNow' },
  { id: 'delivery' },
  { id: 'pickup' },
  { id: 'topRated', mock: true },
];

/** The two outlined pills under the search bar ("Sırala" / "Filtrele") and the sheets they open. */
export function SortFilterBar() {
  const { t } = useTranslation();
  const { sort, filters, setSort, setFilters } = useHomeView();
  const [sheet, setSheet] = useState<'sort' | 'filter' | null>(null);
  const count = activeFilterCount(filters);
  const close = () => setSheet(null);
  // Mock options only exist while mocks are shown, and always carry their label.
  const label = (key: string, mock?: boolean) => (mock ? `${t(key)} (${t('common.mock')})` : t(key));
  const sorts = SORTS.filter((o) => !o.mock || SHOW_MOCKS);
  const switches = SWITCHES.filter((o) => !o.mock || SHOW_MOCKS);

  return (
    <View style={styles.row}>
      <Pressable style={styles.pill} onPress={() => setSheet('sort')} accessibilityRole="button">
        <ArrowDownWideNarrow size={16} color={colors.foreground} />
        <Text style={styles.pillText}>{t('sort.title')}</Text>
      </Pressable>
      <Pressable style={styles.pill} onPress={() => setSheet('filter')} accessibilityRole="button">
        <SlidersHorizontal size={16} color={colors.foreground} />
        <Text style={styles.pillText}>{t('filters.title')}</Text>
        {count > 0 ? (
          <View style={styles.count}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
      </Pressable>

      <Modal visible={sheet === 'sort'} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <View style={styles.sheet}>
          <SheetHeader title={t('sort.title')} onClose={close} />
          <View style={styles.options}>
            {sorts.map(({ id, mock }) => (
              <Pressable
                key={id}
                style={styles.option}
                onPress={() => {
                  setSort(id);
                  close();
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: sort === id }}
              >
                <Text style={styles.optionText}>{label(`sort.${id}`, mock)}</Text>
                {sort === id ? <Check size={20} color={colors.primary} strokeWidth={3} /> : null}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={sheet === 'filter'} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <View style={styles.sheet}>
          <SheetHeader title={t('filters.title')} onClose={close} action={count > 0 ? { label: t('filters.clear'), onPress: () => setFilters(NO_FILTERS) } : undefined} />
          <View style={styles.options}>
            {switches.map(({ id, mock }) => (
              <Pressable
                key={id}
                style={styles.option}
                onPress={() => setFilters({ ...filters, [id]: !filters[id] })}
                accessibilityRole="switch"
                accessibilityState={{ checked: !!filters[id] }}
              >
                <Text style={styles.optionText}>{label(`filters.${id}`, mock)}</Text>
                <Switch value={!!filters[id]} pointerEvents="none" trackColor={{ true: colors.primary }} />
              </Pressable>
            ))}
          </View>
          <View style={styles.footer}>
            <Button title={t('filters.done')} onPress={close} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SheetHeader({ title, onClose, action }: { title: string; onClose: () => void; action?: { label: string; onPress: () => void } }) {
  const { t } = useTranslation();
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.headerActions}>
        {action ? (
          <Pressable onPress={action.onPress} hitSlop={10} accessibilityRole="button">
            <Text style={styles.headerLink}>{action.label}</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
          <Text style={styles.headerLink}>{t('common.close')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.sm },
  pill: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  pillText: { fontSize: 13, fontWeight: weight.semibold, color: colors.foreground },
  count: { minWidth: 20, height: 20, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  countText: { fontSize: font.small, fontWeight: weight.bold, color: colors.primaryForeground },
  sheet: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.xl },
  title: { fontSize: font.heading, fontWeight: weight.bold, color: colors.foreground },
  headerActions: { flexDirection: 'row', gap: space.lg },
  headerLink: { fontSize: font.base, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  options: { paddingHorizontal: space.lg, gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    minHeight: 56,
    paddingHorizontal: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionText: { flex: 1, fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
  footer: { padding: space.lg },
});
