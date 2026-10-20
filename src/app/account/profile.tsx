import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SHOW_MOCKS } from '@/config';
import { qk } from '@/queries/keys';
import { getProfile } from '@/services/profile.service';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { ErrorState } from '@/ui/ErrorState';
import { Skeleton } from '@/ui/Skeleton';
import { TextField } from '@/ui/TextField';

/**
 * The profile from GET /profile as read-only rows. The API has no PUT /profile yet, so "Edit" (shown only while
 * SHOW_MOCKS is on) opens the form but saving only says it is coming; wire it up when the route exists.
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const { data: profile, isLoading, isError, refetch } = useQuery({ queryKey: qk.profile, queryFn: getProfile });
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  if (isLoading) {
    return (
      <View style={styles.content}>
        <Skeleton height={200} radius={12} />
      </View>
    );
  }
  if (isError || !profile) return <ErrorState message={t('account.profile.loadFailed')} onRetry={() => void refetch()} />;

  const rows = [
    { key: 'firstName', value: profile.firstName },
    { key: 'lastName', value: profile.lastName },
    { key: 'email', value: profile.email },
    ...(profile.phoneNumber ? [{ key: 'phone', value: profile.phoneNumber }] : []),
  ];

  const startEditing = () => {
    setFirstName(profile.firstName);
    setLastName(profile.lastName);
    setEditing(true);
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {SHOW_MOCKS && editing ? (
          <View style={styles.form}>
            <TextField label={t('account.profile.firstName')} value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
            <TextField label={t('account.profile.lastName')} value={lastName} onChangeText={setLastName} autoCapitalize="words" />
            <Button title={t('account.profile.save')} onPress={() => Alert.alert(t('account.profile.editSoon'))} />
            <Button variant="ghost" title={t('common.cancel')} onPress={() => setEditing(false)} />
          </View>
        ) : (
          <>
            <View style={styles.card}>
              {rows.map((row) => (
                <View key={row.key} style={styles.row}>
                  <Text style={styles.label}>{t(`account.profile.${row.key}`)}</Text>
                  <Text style={styles.value}>{row.value}</Text>
                </View>
              ))}
            </View>
            {SHOW_MOCKS ? <Button variant="secondary" title={t('account.profile.edit')} onPress={startEditing} /> : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg },
  card: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  row: { padding: space.lg, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { fontSize: font.small, color: colors.mutedForeground },
  value: { fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
  form: { gap: space.lg },
});
