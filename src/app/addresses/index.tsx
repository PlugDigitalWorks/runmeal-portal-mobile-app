import { useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { Check, MapPin, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useLocation } from '@/context/LocationContext';
import { addressFirstLine, addressSecondLine } from '@/lib/address';
import { apiErrorMessage } from '@/lib/api-error';
import { qk } from '@/queries/keys';
import { useAddresses } from '@/queries/useAddresses';
import { deleteAddress } from '@/services/address.service';
import type { Address } from '@/types/address';
import { colors, font, radius, space, weight } from '@/theme';
import { EmptyState } from '@/ui/EmptyState';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';

/** The delivery addresses, the active one ticked; tapping one makes it active and goes back. */
export default function AddressesScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: addresses, isLoading, isError, isRefetching, refetch } = useAddresses();
  const { activeAddress, selectAddress } = useLocation();
  const [error, setError] = useState<string | null>(null);
  // One change at a time: a second tap mid-request would race the first.
  const busy = useRef(false);

  const run = async (action: () => Promise<void>, fallback: string) => {
    if (busy.current) return false;
    busy.current = true;
    setError(null);
    try {
      await action();
      return true;
    } catch (e) {
      setError(apiErrorMessage(e, fallback));
      return false;
    } finally {
      busy.current = false;
    }
  };

  const choose = async (address: Address) => {
    if (address.id === activeAddress?.id) return router.back();
    if (await run(() => selectAddress(address.id), t('addresses.failed'))) router.back();
  };

  const confirmDelete = (address: Address) =>
    Alert.alert(t('addresses.deleteTitle'), addressFirstLine(address), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          run(async () => {
            await deleteAddress(address.id);
            // The active address may be the one that went; the context picks the next one from the fresh list.
            await Promise.all([queryClient.invalidateQueries({ queryKey: qk.addresses }), queryClient.invalidateQueries({ queryKey: ['nearby'] })]);
          }, t('addresses.deleteFailed')),
      },
    ]);

  const add = () => router.push('/addresses/form');

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.list]}>
        <Skeleton height={76} radius={radius.xl} />
        <Skeleton height={76} radius={radius.xl} />
      </View>
    );
  }
  if (isError && !addresses) {
    return (
      <View style={styles.screen}>
        <ErrorState onRetry={() => void refetch()} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={add} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('addresses.add')}>
              <Plus size={24} color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={addresses ?? []}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
        ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : undefined}
        ListEmptyComponent={
          <EmptyState
            icon={<MapPin size={32} color={colors.primarySoftForeground} />}
            title={t('addresses.empty')}
            body={t('addresses.emptyBody')}
            actionLabel={t('addresses.add')}
            onAction={add}
          />
        }
        ListFooterComponent={
          addresses?.length ? (
            <Pressable style={styles.addRow} onPress={add} accessibilityRole="button">
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addText}>{t('addresses.add')}</Text>
            </Pressable>
          ) : undefined
        }
        renderItem={({ item }) => {
          const active = item.id === activeAddress?.id;
          return (
            <Pressable
              testID={`address-${item.id}`}
              style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && { opacity: 0.9 }]}
              onPress={() => choose(item)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <View style={[styles.radio, active && styles.radioOn]}>
                {active ? <Check size={14} color={colors.primaryForeground} strokeWidth={3} /> : null}
              </View>
              <View style={styles.text}>
                <Text style={styles.line} numberOfLines={2}>
                  {item.title ? `${item.title} · ` : ''}
                  {addressFirstLine(item)}
                </Text>
                <Text style={styles.detail}>{addressSecondLine(item)}</Text>
                {active ? <Text style={styles.activeLabel}>{t('addresses.active')}</Text> : null}
              </View>
              <Pressable
                onPress={() => router.push({ pathname: '/addresses/form', params: { id: item.id } })}
                hitSlop={8}
                accessibilityLabel={t('addresses.edit')}
                style={styles.icon}
              >
                <Pencil size={18} color={colors.mutedForeground} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8} accessibilityLabel={t('common.delete')} style={styles.icon}>
                <Trash2 size={18} color={colors.destructive} />
              </Pressable>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: space.lg, gap: 10 },
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
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  text: { flex: 1, gap: 2 },
  line: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  detail: { fontSize: font.body, color: colors.mutedForeground },
  activeLabel: { fontSize: font.small, fontWeight: weight.bold, color: colors.primary, marginTop: 2 },
  icon: { padding: 6 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  addText: { color: colors.primary, fontWeight: weight.bold, fontSize: font.base },
  error: { color: colors.destructive, fontSize: font.body, textAlign: 'center' },
});
