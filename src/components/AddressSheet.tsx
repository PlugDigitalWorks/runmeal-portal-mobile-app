import { router } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocation } from '@/context/LocationContext';
import { addressFirstLine, addressSecondLine } from '@/lib/address';
import { useAddresses } from '@/queries/useAddresses';
import { colors, font, radius, space, weight } from '@/theme';
import type { Address } from '@/types/address';

type Props = { visible: boolean; onClose: () => void };

/** Quick address picker for the home header: choose the delivery address without leaving the feed. */
export function AddressSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { data: addresses } = useAddresses();
  const { activeAddress, selectAddress } = useLocation();

  const choose = async (address: Address) => {
    // Close first: the feed refetches behind the sheet once the new address is active.
    onClose();
    if (address.id !== activeAddress?.id) await selectAddress(address.id).catch(() => {});
  };

  const add = () => {
    onClose();
    router.push('/addresses/form');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('addresses.sheetTitle')}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
            <Text style={styles.close}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.list}>
          {(addresses ?? []).map((address) => {
            const active = address.id === activeAddress?.id;
            return (
              <Pressable
                key={address.id}
                testID={`sheet-address-${address.id}`}
                style={[styles.row, active && styles.rowActive]}
                onPress={() => choose(address)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <View style={styles.text}>
                  <Text style={styles.line} numberOfLines={2}>
                    {addressFirstLine(address)}
                  </Text>
                  <Text style={styles.detail}>{addressSecondLine(address)}</Text>
                </View>
                {active ? <Check size={20} color={colors.primary} strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
          <Pressable style={styles.addRow} onPress={add} accessibilityRole="button">
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addText}>{t('addresses.addNew')}</Text>
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
  list: { paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowActive: { borderColor: colors.primary },
  text: { flex: 1, gap: 2 },
  line: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  detail: { fontSize: font.body, color: colors.mutedForeground },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  addText: { color: colors.primary, fontWeight: weight.bold, fontSize: font.base },
});
