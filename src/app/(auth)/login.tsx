import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SocialSignIn } from '@/components/SocialSignIn';
import { SIGN_IN_APPLE, SIGN_IN_GOOGLE } from '@/config';
import { useAuth } from '@/context/AuthContext';
import { useCaptcha } from '@/hooks/useCaptcha';
import { apiErrorMessage } from '@/lib/api-error';
import { loginWithPassword, requestOtpLogin } from '@/services/auth.service';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Emailed one-time code by default, password as an option. The API wants a
 * reCAPTCHA token on /auth/login, asked for in a sheet once the form is valid.
 */
export default function Login() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [withPassword, setWithPassword] = useState(false);
  const { requestToken, sheet } = useCaptcha();
  const [busy, setBusy] = useState(false);
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = email.trim().toLowerCase();
    const next = {
      email: EMAIL.test(trimmed) ? undefined : t('auth.invalidEmail'),
      password: withPassword && !password ? t('auth.passwordRequired') : undefined,
    };
    setFieldError(next);
    setError(null);
    if (next.email || next.password) return;

    const captcha = await requestToken();
    if (!captcha) return;

    setBusy(true);
    try {
      if (withPassword) {
        await signIn(await loginWithPassword(trimmed, password, captcha));
        router.replace('/');
      } else {
        await requestOtpLogin(trimmed, captcha);
        router.push({ pathname: '/(auth)/verify', params: { email: trimmed, mode: 'login' } });
      }
    } catch (e) {
      setError(apiErrorMessage(e, t('errors.generic')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} />
          <Text style={styles.brand}>Runmeal</Text>
          <Text style={styles.title}>{t('auth.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
        </View>

        <TextField
          label={t('auth.email')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setFieldError((current) => ({ ...current, email: undefined }));
          }}
          error={fieldError.email}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        {withPassword ? (
          <TextField
            label={t('auth.password')}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setFieldError((current) => ({ ...current, password: undefined }));
            }}
            error={fieldError.password}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title={withPassword ? t('auth.signIn') : t('auth.sendCode')} loading={busy} onPress={submit} />

        <Pressable onPress={() => setWithPassword((v) => !v)} hitSlop={8} style={styles.linkWrap}>
          <Text style={styles.link}>{withPassword ? t('auth.useCode') : t('auth.usePassword')}</Text>
        </Pressable>
        {SIGN_IN_GOOGLE || SIGN_IN_APPLE ? (
          <SocialSignIn
            busy={busy}
            onSignedIn={async (auth) => {
              setError(null);
              await signIn(auth);
              router.replace('/');
            }}
            onError={(e) => setError(apiErrorMessage(e, t('errors.generic')))}
          />
        ) : null}

        <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8} style={styles.linkWrap}>
          <Text style={styles.footer}>{t('auth.noAccount')}</Text>
        </Pressable>
      </ScrollView>
      {sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.xxl, gap: space.lg },
  hero: { alignItems: 'center', gap: space.sm, marginVertical: space.xl },
  logo: { width: 72, height: 72, borderRadius: 16 },
  brand: { fontSize: font.title, fontWeight: weight.bold, color: colors.primaryPressed },
  title: { fontSize: font.display, fontWeight: weight.bold, color: colors.foreground, marginTop: space.md },
  subtitle: { fontSize: font.base, color: colors.mutedForeground, textAlign: 'center' },
  error: { fontSize: font.body, color: colors.destructive },
  linkWrap: { alignSelf: 'center' },
  link: { fontSize: font.body, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  footer: { fontSize: font.body, color: colors.mutedForeground },
});
