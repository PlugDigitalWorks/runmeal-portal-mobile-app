import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppLanguage } from '@/lib/language';
import { colors, font, radius, space, weight } from '@/theme';

type Props = { visible: boolean; current: AppLanguage; onSelect: (lang: AppLanguage) => void; onClose: () => void };

const LANGUAGES: AppLanguage[] = ['tr', 'en'];

/** Two-option language picker; the language names stay in their own language in both translations. */
export function LanguageSheet({ visible, current, onSelect, onClose }: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('account.language.title')}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
            <Text style={styles.close}>{t('common.close')}</Text>
          </Pressable>
        </View>
        {LANGUAGES.map((lang) => (
          <Pressable
            key={lang}
            testID={`language-${lang}`}
            onPress={() => onSelect(lang)}
            accessibilityRole="radio"
            accessibilityState={{ selected: lang === current }}
            style={[styles.row, lang === current && styles.rowActive]}
          >
            <Text style={styles.label}>{t(`account.language.${lang}`)}</Text>
            {lang === current ? <Check size={20} color={colors.primarySoftForeground} /> : null}
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background, padding: space.lg, gap: space.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: space.sm },
  title: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  close: { fontSize: font.base, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  label: { fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
});
