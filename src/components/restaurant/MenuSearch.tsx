import { Search, X } from 'lucide-react-native';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';
import { colors, font, radius, space } from '@/theme';

type Props = { value: string; onChange: (value: string) => void; inputRef?: RefObject<TextInputInstance | null> };

/** "Restoranda ara": a grey pill that filters the menu on the device as you type. */
export function MenuSearch({ value, onChange, inputRef }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.bar}>
      <Search size={18} color={colors.subtle} />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChange}
        placeholder={t('restaurant.searchPlaceholder')}
        placeholderTextColor={colors.subtle}
        accessibilityLabel={t('restaurant.searchPlaceholder')}
        returnKeyType="search"
        autoCorrect={false}
        style={styles.input}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={10} accessibilityRole="button" accessibilityLabel={t('restaurant.searchClear')}>
          <X size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { height: 40, marginHorizontal: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, borderRadius: radius.full, backgroundColor: colors.searchFill },
  input: { flex: 1, height: 40, fontSize: font.body, color: colors.foreground },
});
