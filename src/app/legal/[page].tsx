import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { legalDocument, type LegalBlock } from '@/content/legal';
import { colors, font, space, weight } from '@/theme';

/** The privacy policy or terms of use, read in the app rather than in a browser. The header carries the title. */
export default function LegalScreen() {
  const { t, i18n } = useTranslation();
  const { page } = useLocalSearchParams<{ page: string }>();
  const doc = legalDocument(page === 'terms' ? 'terms' : 'privacy', i18n.language === 'tr' ? 'tr' : 'en');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.updated}>{t('legal.updated', { date: doc.updated })}</Text>
      {doc.intro.map((block, i) => (
        <Block key={i} block={block} />
      ))}
      {doc.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            {section.heading}
          </Text>
          {section.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

function Block({ block }: { block: LegalBlock }) {
  if (!Array.isArray(block)) return <Text style={styles.body}>{block}</Text>;
  return (
    <View style={styles.list}>
      {block.map((item) => (
        <View key={item} style={styles.bullet}>
          <Text style={styles.body}>•</Text>
          <Text style={[styles.body, styles.bulletText]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.card },
  content: { padding: space.xl, paddingBottom: 48, gap: space.md },
  updated: { fontSize: font.small, color: colors.mutedForeground },
  section: { gap: 8, marginTop: 4 },
  heading: { fontSize: font.base + 1, fontWeight: weight.bold, color: colors.foreground },
  body: { fontSize: font.body, lineHeight: 21, color: colors.foreground },
  list: { gap: 6 },
  bullet: { flexDirection: 'row', gap: 8 },
  bulletText: { flex: 1 },
});
