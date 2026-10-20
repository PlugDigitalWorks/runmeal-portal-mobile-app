import { router } from 'expo-router';
import * as Application from 'expo-application';
import { CircleHelp, FileText, ShieldCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccountRow } from '@/components/account/AccountRow';
import { LEGAL_ENTITY } from '@/content/legal';
import { SHOW_MOCKS } from '@/config';
import { colors, font, space, weight } from '@/theme';

/** Legal pages, the help centre (a labelled mock) and an About block with the app name, version and company. */
export default function MoreScreen() {
  const { t } = useTranslation();
  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.group}>
        <AccountRow icon={ShieldCheck} title={t('account.more.privacy')} onPress={() => router.push('/legal/privacy')} />
        <AccountRow icon={FileText} title={t('account.more.terms')} onPress={() => router.push('/legal/terms')} />
        {SHOW_MOCKS ? <AccountRow icon={CircleHelp} title={t('account.more.help')} mock onPress={() => Alert.alert(t('account.more.helpSoon'))} /> : null}
      </View>
      <View style={styles.about}>
        <Text style={styles.aboutTitle}>{t('account.more.aboutTitle')}</Text>
        <Text style={styles.appName}>{t('account.more.appName')}</Text>
        {version ? <Text style={styles.meta}>{`v${version}${build ? ` (${build})` : ''}`}</Text> : null}
        <Text style={styles.meta}>{LEGAL_ENTITY.name}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.xl },
  group: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  about: { alignItems: 'center', gap: 4 },
  aboutTitle: { fontSize: font.small, fontWeight: weight.semibold, color: colors.subtle, textTransform: 'uppercase' },
  appName: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  meta: { fontSize: font.body, color: colors.mutedForeground },
});
