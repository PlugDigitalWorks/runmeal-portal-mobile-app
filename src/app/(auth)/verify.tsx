import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useCaptcha } from '@/hooks/useCaptcha';
import { apiErrorMessage } from '@/lib/api-error';
import { requestOtpLogin, verifyOtp } from '@/services/auth.service';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';

const RESEND_SECONDS = 30;

/**
 * The 6-digit code from the email. It submits itself on the sixth digit. A new
 * code goes through /auth/login (the account exists in both modes) and so needs
 * a fresh reCAPTCHA token, which is only asked for (in a sheet) when the person taps resend.
 */
export default function Verify() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { email = '', mode } = useLocalSearchParams<{ email?: string; mode?: 'login' | 'register' }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const { requestToken, sheet } = useCaptcha();

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const verify = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      await signIn(await verifyOtp(email, value));
      router.replace('/');
    } catch (e) {
      setError(apiErrorMessage(e, t('errors.generic')));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const onChangeCode = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setError(null);
    if (digits.length === 6 && !busy) void verify(digits);
  };

  const resend = async () => {
    const token = await requestToken();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await requestOtpLogin(email, token);
      setCode('');
      setSeconds(RESEND_SECONDS);
    } catch (e) {
      setError(apiErrorMessage(e, t('errors.generic')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>{t(mode === 'register' ? 'auth.verifyRegisterTitle' : 'auth.verifyTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.verifyBody', { email })}</Text>
      <TextField
        label={t('auth.code')}
        value={code}
        onChangeText={onChangeCode}
        error={error ?? undefined}
        keyboardType="number-pad"
        maxLength={6}
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        editable={!busy}
        autoFocus
        style={styles.codeInput}
      />
      <Button
        variant="secondary"
        title={seconds > 0 ? t('auth.resendIn', { seconds }) : t('auth.resend')}
        disabled={seconds > 0 || busy}
        onPress={resend}
      />
      {sheet}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background },
  content: { padding: space.xxl, gap: space.lg },
  title: { fontSize: font.display, fontWeight: weight.bold, color: colors.foreground },
  subtitle: { fontSize: font.base, color: colors.mutedForeground },
  codeInput: { textAlign: 'center', fontSize: font.heading, letterSpacing: 8, fontWeight: weight.bold },
});
