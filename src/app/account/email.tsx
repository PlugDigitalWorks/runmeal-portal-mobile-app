import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors, space } from '@/theme';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';

/** Changing the sign-in email needs an API route that does not exist yet; the form is a labelled mock. */
export default function EmailScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextField label={t('account.email.current')} value={user?.email ?? ''} onChangeText={() => undefined} editable={false} />
        <TextField label={t('account.email.new')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
        <Button title={t('account.email.send')} onPress={() => Alert.alert(t('account.email.soon'))} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg },
});
