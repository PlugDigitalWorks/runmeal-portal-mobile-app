import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiErrorMessage } from '@/lib/api-error';
import { registerWithOtp } from '@/services/auth.service';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Sign-up without a password: the API emails a code that the verify screen exchanges for a session. */
export default function Register() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<{ name?: string; email?: string }>({});
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    const next = {
      name: firstName.trim() && lastName.trim() ? undefined : t('auth.nameRequired'),
      email: EMAIL.test(trimmed) ? undefined : t('auth.invalidEmail'),
    };
    setFieldError(next);
    setError(null);
    if (next.name || next.email) return;

    setBusy(true);
    try {
      await registerWithOtp({ email: trimmed, firstName: firstName.trim(), lastName: lastName.trim() });
      router.push({ pathname: '/(auth)/verify', params: { email: trimmed, mode: 'register' } });
    } catch (e) {
      setError(apiErrorMessage(e, t('errors.generic')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t('auth.registerTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.registerSubtitle')}</Text>
      <TextField label={t('auth.firstName')} value={firstName} onChangeText={setFirstName} autoComplete="given-name" textContentType="givenName" />
      <TextField label={t('auth.lastName')} value={lastName} onChangeText={setLastName} error={fieldError.name} autoComplete="family-name" textContentType="familyName" />
      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        error={fieldError.email}
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button title={t('auth.register')} loading={busy} onPress={submit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background },
  content: { padding: space.xxl, gap: space.lg },
  title: { fontSize: font.display, fontWeight: weight.bold, color: colors.foreground },
  subtitle: { fontSize: font.base, color: colors.mutedForeground },
  error: { fontSize: font.body, color: colors.destructive },
});
