import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiErrorMessage } from '@/lib/api-error';
import { buildAddItem } from '@/lib/cart-model';
import { formatMoney } from '@/lib/money';
import { initialSelections, optionsTotal, toggleOption, validateSelections, type SelectionProblem, type Selections } from '@/lib/product-options';
import { qk } from '@/queries/keys';
import { useAddToCart } from '@/queries/useCart';
import { useProduct } from '@/queries/useProduct';
import { colors, font, radius, space, weight } from '@/theme';
import type { Menu, OptionGroup } from '@/types/product';
import { Button } from '@/ui/Button';
import { ErrorState } from '@/ui/ErrorState';
import { Price } from '@/ui/Price';
import { QuantityStepper } from '@/ui/QuantityStepper';

/** Product bottom sheet: photo, option groups, note, quantity and a CTA that shows the running total. */
export default function ProductSheet() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id, branchId, brandId } = useLocalSearchParams<{ id: string; branchId: string; brandId: string }>();
  const { data: product, isError, refetch } = useProduct(id, branchId, brandId);
  const { mutateAsync } = useAddToCart();
  // null until the person touches an option: the defaults are derived, so there is no effect to sync them.
  const [picked, setPicked] = useState<Selections | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<SelectionProblem | null>(null);
  const [adding, setAdding] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const groupY = useRef<Record<string, number>>({});

  const groups = useMemo(() => [...(product?.optionGroups ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [product]);
  const selections = picked ?? initialSelections(groups);
  // The menu is already cached by the restaurant page; the product call carries no currency.
  const cachedMenu = queryClient.getQueryData<Menu>(qk.menu(branchId));
  const currency = cachedMenu?.currency ?? 'TRY';
  const symbol = cachedMenu?.currencySymbol;
  const unit = Number(product?.discountedPrice ?? product?.price ?? 0) + optionsTotal(groups, selections);
  const total = unit * quantity;

  const onToggle = (group: OptionGroup, optionId: string) => {
    const result = toggleOption(selections, group, optionId);
    setPicked(result.selections);
    setProblem(null);
    setMessage(result.rejected ? t('product.maxError', { count: result.rejected.count }) : null);
  };

  const onAdd = async () => {
    if (!product) return;
    const found = validateSelections(groups, selections);
    if (found) {
      setProblem(found);
      // A minimum of one is just "required"; the count only helps when more than one is needed.
      setMessage(
        found.reason === 'min' && found.count > 1
          ? t('product.minError', { group: found.groupName, count: found.count })
          : t('product.required', { group: found.groupName }),
      );
      const target = groups.find((g) => g.name === found.groupName);
      const y = target ? groupY.current[target.id] : undefined;
      if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - space.lg), animated: true });
      return;
    }
    setAdding(true);
    setMessage(null);
    try {
      const result = await mutateAsync({ dto: buildAddItem(product, groups, selections, quantity, note), branchId, brandId });
      // 'cancelled' means the person declined to switch restaurants: keep the sheet so they can pick again.
      if (result === 'added') router.back();
    } catch (error) {
      setMessage(apiErrorMessage(error, t('product.addFailed')));
    } finally {
      setAdding(false);
    }
  };

  const close = (
    <Pressable style={styles.close} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={8}>
      <X size={20} color={colors.foreground} />
    </Pressable>
  );

  // Without the branch and brand the cart call cannot be made, so there is nothing safe to show.
  if (isError || !branchId || !brandId) {
    return (
      <View style={[styles.sheet, styles.center]}>
        <ErrorState message={t('product.error')} onRetry={refetch} />
        {close}
      </View>
    );
  }
  if (!product) {
    return (
      <View style={[styles.sheet, styles.center]}>
        <ActivityIndicator color={colors.primary} />
        {close}
      </View>
    );
  }

  return (
    <View style={styles.sheet}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          {product.imageUrl ? <Image source={{ uri: product.imageUrl }} contentFit="cover" style={StyleSheet.absoluteFill} /> : null}
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{product.name}</Text>
          <Price
            value={product.discountedPrice ?? product.price}
            original={product.discountedPrice != null ? Number(product.price) : null}
            currency={currency}
            symbol={symbol}
            size="lg"
          />
          {product.description ? <Text style={styles.description}>{product.description}</Text> : null}

          {groups.map((group) => (
            <View key={group.id} onLayout={(e) => (groupY.current[group.id] = e.nativeEvent.layout.y)}>
              <OptionGroupBlock
                group={group}
                selected={selections[group.id] ?? []}
                currency={currency}
                symbol={symbol}
                invalid={problem?.groupName === group.name}
                onToggle={(optionId) => onToggle(group, optionId)}
              />
            </View>
          ))}

          <View style={styles.group}>
            <Text style={styles.groupTitle}>{t('product.note')}</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('product.notePlaceholder')}
              placeholderTextColor={colors.subtle}
              multiline
              maxLength={1000}
              style={styles.note}
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.md) }]}>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <View style={styles.footerRow}>
          <QuantityStepper value={quantity} onChange={setQuantity} />
          <View style={styles.cta}>
            <Button title={`${t('product.addToCart')} · ${formatMoney(total, currency, { symbol })}`} onPress={onAdd} loading={adding} />
          </View>
        </View>
      </View>
      {close}
    </View>
  );
}

type GroupProps = { group: OptionGroup; selected: string[]; currency: string; symbol?: string | null; invalid: boolean; onToggle: (optionId: string) => void };

function OptionGroupBlock({ group, selected, currency, symbol, invalid, onToggle }: GroupProps) {
  const { t } = useTranslation();
  const single = group.type === 'SINGLE' || group.type === 'VARIANT';
  const rule = group.minSelections && group.minSelections > 1 ? t('product.selectAtLeast', { count: group.minSelections }) : group.isRequired ? t('product.chooseOne') : null;

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupTitle}>{group.name}</Text>
          {rule ? <Text style={[styles.groupRule, invalid && styles.invalidText]}>{rule}</Text> : null}
          {!single && group.maxSelections ? <Text style={styles.groupMax}>{t('product.max', { count: group.maxSelections })}</Text> : null}
        </View>
        <Text style={[styles.tag, group.isRequired ? styles.tagRequired : styles.tagOptional, invalid && styles.tagInvalid]}>
          {group.isRequired ? t('product.requiredTag') : t('product.optional')}
        </Text>
      </View>
      {[...group.options]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((option) => {
          const on = selected.includes(option.id);
          return (
            <Pressable
              key={option.id}
              onPress={() => onToggle(option.id)}
              style={[styles.option, on ? styles.optionOn : invalid ? styles.optionInvalid : styles.optionOff]}
              accessibilityRole={single ? 'radio' : 'checkbox'}
              accessibilityState={{ checked: on }}
            >
              <View style={[single ? styles.radio : styles.checkbox, on && styles.markOn]}>
                {on ? single ? <View style={styles.radioDot} /> : <Check size={14} color={colors.primaryForeground} /> : null}
              </View>
              <Text style={[styles.optionName, on && { color: colors.primarySoftForeground }]}>{option.name}</Text>
              {Number(option.priceDelta) === 0 ? (
                <Text style={styles.free}>{t('product.free')}</Text>
              ) : (
                <Text style={styles.delta}>+{formatMoney(option.priceDelta, currency, { symbol })}</Text>
              )}
            </Pressable>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.card },
  center: { alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: space.xxl },
  hero: { width: '100%', height: 240, backgroundColor: colors.bannerPlaceholder },
  close: {
    position: 'absolute',
    top: space.lg,
    right: space.lg,
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { padding: space.xl, gap: space.lg },
  title: { fontSize: font.heading, fontWeight: weight.bold, color: colors.foreground },
  description: { fontSize: font.body, color: colors.mutedForeground, lineHeight: 21 },
  group: { gap: space.sm, paddingBottom: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  groupHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  groupTitle: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  groupRule: { fontSize: font.body, color: colors.mutedForeground, marginTop: 2 },
  groupMax: { fontSize: font.small, color: colors.subtle },
  invalidText: { color: colors.destructive },
  tag: { fontSize: font.small, fontWeight: weight.semibold, paddingHorizontal: space.sm, paddingVertical: 4, borderRadius: radius.sm, overflow: 'hidden' },
  tagRequired: { backgroundColor: colors.primarySoft, color: colors.primarySoftForeground },
  tagOptional: { backgroundColor: colors.background, color: colors.subtle },
  tagInvalid: { backgroundColor: colors.destructiveSoft, color: colors.destructive },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: 14, borderRadius: radius.md, borderWidth: 1 },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionOff: { borderColor: colors.border, backgroundColor: colors.card },
  optionInvalid: { borderColor: colors.destructive, backgroundColor: colors.destructiveSoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: colors.subtle, alignItems: 'center', justifyContent: 'center' },
  markOn: { borderColor: colors.primary, backgroundColor: colors.primary },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryForeground },
  optionName: { flex: 1, fontSize: font.base - 1, fontWeight: weight.semibold, color: colors.foreground },
  free: { fontSize: font.body, fontWeight: weight.bold, color: colors.success },
  delta: { fontSize: font.body, fontWeight: weight.semibold, color: colors.mutedForeground },
  note: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: space.md,
    fontSize: font.body,
    color: colors.foreground,
    textAlignVertical: 'top',
  },
  footer: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.sm, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  cta: { flex: 1 },
  message: { fontSize: font.small + 1, fontWeight: weight.semibold, color: colors.destructive, textAlign: 'center' },
});
