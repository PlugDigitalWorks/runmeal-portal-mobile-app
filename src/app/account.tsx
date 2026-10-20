import * as Application from 'expo-application';
import { router } from 'expo-router';
import { Bell, CreditCard, Ellipsis, Gift, Heart, Languages, LogOut, Mail, MapPin, MessageSquareHeart, Receipt, ShieldCheck, Sparkles, TicketPercent, User as UserIcon, Wallet } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccountRow } from '@/components/account/AccountRow';
import { LanguageSheet } from '@/components/account/LanguageSheet';
import { IS_STAGING, SHOW_MOCKS } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { changeLanguage, type AppLanguage } from '@/lib/language';
import { formatMoney } from '@/lib/money';
import { useCreditBalance } from '@/queries/useCreditBalance';
import { colors, font, radius, space, weight } from '@/theme';
import { MockTag } from '@/ui/MockTag';

/**
 * "Hesabım" (Uber Eats style): who is signed in, two small stat pills, then one plain list of rows.
 * What the API cannot back yet is a row with a Mock tag, and drops out of the list when SHOW_MOCKS is off.
 */
export default function Account() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { data: credit } = useCreditBalance();
  const [languageOpen, setLanguageOpen] = useState(false);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toLocaleUpperCase(i18n.language);
  const language: AppLanguage = i18n.language === 'tr' ? 'tr' : 'en';
  const version = Application.nativeApplicationVersion;
  const build = Application.nativeBuildVersion;

  const confirmSignOut = () =>
    Alert.alert(t('account.signOutConfirmTitle'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.signOut'),
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);

  const pickLanguage = async (lang: AppLanguage) => {
    setLanguageOpen(false);
    if (lang !== language) await changeLanguage(lang);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} bounces={false}>
      <View style={styles.card}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            {initials ? <Text style={styles.initials}>{initials}</Text> : <UserIcon size={22} color={colors.primarySoftForeground} />}
          </View>
          <View style={styles.who}>
            {name ? <Text style={styles.name}>{name}</Text> : null}
            {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
          </View>
        </View>
        <View style={styles.pills}>
          {credit !== undefined ? (
            <View style={styles.pill}>
              <Wallet size={14} color={colors.primarySoftForeground} />
              <Text style={styles.pillText}>{t('account.credit', { amount: formatMoney(credit, 'TRY', { symbol: '₺' }) })}</Text>
            </View>
          ) : null}
          {SHOW_MOCKS ? (
            <View style={styles.pill}>
              <Sparkles size={14} color={colors.primarySoftForeground} />
              <Text style={styles.pillText}>{t('account.plus')}</Text>
              <MockTag />
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.group}>
        <AccountRow icon={UserIcon} title={t('account.rows.profile')} onPress={() => router.push('/account/profile')} />
        <AccountRow icon={MapPin} title={t('account.rows.addresses')} onPress={() => router.push('/addresses')} />
        {SHOW_MOCKS ? <AccountRow icon={CreditCard} title={t('account.rows.cards')} mock onPress={() => router.push('/account/cards')} /> : null}
        <AccountRow icon={TicketPercent} title={t('account.rows.coupons')} mock={SHOW_MOCKS} onPress={() => router.push('/account/coupons')} />
        <AccountRow icon={Gift} title={t('account.rows.rewards')} onPress={() => router.push('/rewards')} />
        <AccountRow icon={Heart} title={t('account.rows.favorites')} onPress={() => router.navigate('/(tabs)/favorites')} />
        <AccountRow icon={Receipt} title={t('account.rows.orders')} onPress={() => router.navigate('/(tabs)/orders')} />
        {SHOW_MOCKS ? <AccountRow icon={Mail} title={t('account.rows.email')} mock onPress={() => router.push('/account/email')} /> : null}
        {SHOW_MOCKS ? <AccountRow icon={Bell} title={t('account.rows.notifications')} mock onPress={() => router.push('/account/notifications')} /> : null}
        <AccountRow icon={Languages} title={t('account.rows.language')} value={t(`account.language.${language}`)} onPress={() => setLanguageOpen(true)} />
        {SHOW_MOCKS ? (
          <AccountRow icon={MessageSquareHeart} title={t('account.rows.feedback')} badge={t('account.newBadge')} mock onPress={() => router.push('/account/feedback')} />
        ) : null}
        <AccountRow icon={ShieldCheck} title={t('account.rows.security')} onPress={() => router.push('/account/security')} />
        <AccountRow icon={Ellipsis} title={t('account.rows.more')} onPress={() => router.push('/account/more')} />
        <AccountRow icon={LogOut} title={t('account.signOut')} hideChevron onPress={confirmSignOut} />
      </View>

      <View style={styles.footer}>
        {version ? <Text style={styles.version}>{`v${version}${build ? ` (${build})` : ''}`}</Text> : null}
        {IS_STAGING ? (
          <View style={styles.stagingPill}>
            <Text style={styles.stagingText}>{t('account.staging')}</Text>
          </View>
        ) : null}
      </View>

      <LanguageSheet visible={languageOpen} current={language} onSelect={pickLanguage} onClose={() => setLanguageOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  card: { backgroundColor: colors.card, padding: space.lg, gap: space.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  identity: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: font.title, fontWeight: weight.bold, color: colors.primarySoftForeground },
  who: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: weight.bold, color: colors.foreground },
  email: { fontSize: 13, color: colors.mutedForeground },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  pillText: { fontSize: font.small, fontWeight: weight.semibold, color: colors.foreground },
  group: { marginTop: space.sm, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  footer: { flex: 1, minHeight: 120, marginTop: space.sm, backgroundColor: colors.searchFill, alignItems: 'center', paddingTop: space.xl, gap: space.sm },
  version: { fontSize: font.body, color: colors.mutedForeground },
  stagingPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full, backgroundColor: colors.primarySoft },
  stagingText: { fontSize: font.small, fontWeight: weight.semibold, color: colors.primarySoftForeground },
});
