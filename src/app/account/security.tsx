import { router } from 'expo-router';
import { KeyRound, LogOut, Trash2 } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccountRow } from '@/components/account/AccountRow';
import { useAuth } from '@/context/AuthContext';
import { canDeleteAccount } from '@/lib/account-deletion';
import { apiErrorMessage } from '@/lib/api-error';
import { logoutAll, setPassword } from '@/services/auth.service';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';

const MIN_LENGTH = 8;

/**
 * Real security actions: PATCH /auth/set-password (first password or a change; the API wants only
 * `password`), POST /auth/logout-all followed by the local sign-out, and, for a customer account, the way to /delete-account.
 */
export default function SecurityScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [password, setPasswordText] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // A second tap mid-request would send a second PATCH.
  const inFlight = useRef(false);

  const save = async () => {
    if (inFlight.current) return;
    if (password.length < MIN_LENGTH) return setError(t('account.security.tooShort'));
    if (password !== repeat) return setError(t('account.security.mismatch'));
    inFlight.current = true;
    setSaving(true);
    setError(null);
    try {
      await setPassword(password);
      setPasswordText('');
      setRepeat('');
      Alert.alert(t('account.security.saved'));
    } catch (e) {
      setError(apiErrorMessage(e, t('account.security.failed')));
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  };

  const confirmLogoutAll = () =>
    Alert.alert(t('account.security.logoutAllTitle'), t('account.security.logoutAllBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.security.logoutAll'),
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutAll();
          } catch (e) {
            // Stay signed in: signing out locally would claim the other devices are out when they may not be.
            return Alert.alert(apiErrorMessage(e, t('account.security.logoutAllFailed')));
          }
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <View style={styles.heading}>
            <KeyRound size={18} color={colors.foreground} />
            <Text style={styles.title}>{t('account.security.passwordTitle')}</Text>
          </View>
          <Text style={styles.hint}>{t('account.security.passwordHint')}</Text>
          <TextField label={t('account.security.newPassword')} value={password} onChangeText={setPasswordText} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" />
          <TextField label={t('account.security.repeatPassword')} value={repeat} onChangeText={setRepeat} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType="newPassword" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title={t('account.security.save')} onPress={save} loading={saving} />
        </View>
        <View style={styles.group}>
          <AccountRow icon={LogOut} title={t('account.security.logoutAll')} hideChevron onPress={confirmLogoutAll} />
          {canDeleteAccount(user) ? (
            <AccountRow icon={Trash2} title={t('account.security.delete')} onPress={() => router.push('/delete-account')} />
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.xl },
  section: { gap: space.md },
  heading: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  hint: { fontSize: font.body, color: colors.mutedForeground },
  error: { fontSize: font.body, color: colors.destructive },
  group: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
});
