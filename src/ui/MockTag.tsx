import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { colors, font, radius, weight } from '@/theme';

/** Small grey pill that marks a value as demo data the API cannot back yet; never shown without it. */
export function MockTag() {
  const { t } = useTranslation();
  return (
    <View style={styles.tag}>
      <Text style={styles.text}>{t('common.mock')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  text: { fontSize: font.caption, fontWeight: weight.semibold, color: colors.subtle },
});
