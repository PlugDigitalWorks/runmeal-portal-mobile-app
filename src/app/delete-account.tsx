import { router } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { canDeleteAccount, classifyDeleteError, type DeleteFailure } from '@/lib/account-deletion';
import { expireSession } from '@/lib/api';
import { getTokens } from '@/lib/session';
import { deleteAccount } from '@/services/auth.service';
import { colors, font, radius, space, weight } from '@/theme';

/** The message for a failed delete; `unauthorized` has none, the session-expired flow speaks for it. */
function failureKey(failure: Exclude<DeleteFailure, { kind: 'unauthorized' }>): string {
  switch (failure.kind) {
    case 'refused':
      return `deleteAccount.errors.${failure.code}`;
    case 'forbidden':
      return 'deleteAccount.errors.forbidden';
    case 'unavailable':
      return 'deleteAccount.unavailable';
    case 'unknown':
      return 'deleteAccount.errors.unknown';
    default:
      return 'deleteAccount.failed';
  }
}

/**
 * App Store guideline 5.1.1(v) and Google Play's account deletion policy: an account made in the app
 * can be deleted in the app. Asks once more, then DELETE /profile; on 204 the account is gone, so the
 * app only forgets it locally. Any refusal keeps the person signed in, and a lost answer is never
 * reported as a success or sent again on its own.
 */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const { user, forgetDeletedAccount } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A second tap mid-request would send a second delete.
  const inFlight = useRef(false);

  const remove = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount();
    } catch (e) {
      inFlight.current = false;
      setBusy(false);
      // A rejected token refresh already ended the session; sign-in and its notice are on the way.
      if (!getTokens()) return;
      const failure = classifyDeleteError(e);
      if (failure.kind === 'unauthorized') return void expireSession();
      setError(t(failureKey(failure)));
      return;
    }
    await forgetDeletedAccount();
    router.replace('/(auth)/login');
    Alert.alert(t('deleteAccount.doneTitle'), t('deleteAccount.doneBody'));
  };

  const confirm = () =>
    Alert.alert(t('deleteAccount.confirmTitle'), t('deleteAccount.confirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('deleteAccount.confirm'), style: 'destructive', onPress: remove },
    ]);

  if (!canDeleteAccount(user)) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text style={styles.body}>{t('deleteAccount.notEligible')}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.warning}>
        <TriangleAlert size={20} color={colors.destructive} />
        <Text style={styles.warningText}>{t('deleteAccount.warning')}</Text>
      </View>
      {user?.email ? <Text style={styles.body}>{t('deleteAccount.account', { email: user.email })}</Text> : null}
      <Text style={styles.heading}>{t('deleteAccount.whatHappens')}</Text>
      {(['closed', 'profile', 'loyalty', 'signIn', 'orders', 'wallet'] as const).map((key) => (
        <View key={key} style={styles.bullet}>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.body}>{t(`deleteAccount.points.${key}`)}</Text>
        </View>
      ))}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        testID="delete-account"
        onPress={confirm}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ busy }}
        style={({ pressed }) => [styles.danger, (pressed || busy) && { opacity: 0.8 }]}
      >
        <Text style={styles.dangerText}>{busy ? t('deleteAccount.deleting') : t('deleteAccount.button')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.card },
  content: { padding: space.xl, gap: space.md },
  warning: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: radius.lg, backgroundColor: colors.destructiveSoft },
  warningText: { flex: 1, color: colors.destructive, fontSize: font.body, lineHeight: 20, fontWeight: weight.semibold },
  heading: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground, marginTop: 4 },
  bullet: { flexDirection: 'row', gap: 8 },
  dot: { color: colors.mutedForeground, fontSize: font.body, lineHeight: 20 },
  body: { flex: 1, color: colors.mutedForeground, fontSize: font.body, lineHeight: 20 },
  error: { color: colors.destructive, fontSize: font.body },
  danger: { height: 52, marginTop: 8, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.destructive },
  dangerText: { color: colors.primaryForeground, fontSize: font.base, fontWeight: weight.bold },
});
