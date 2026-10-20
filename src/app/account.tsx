import { router } from 'expo-router';
import { User as UserIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors, font, space, weight } from '@/theme';
import { Button } from '@/ui/Button';

/** Placeholder until the account screen (Task 13) arrives: who is signed in, and a working sign-out. */
export default function Account() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');

  const onSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.root}>
      <View style={styles.avatar}>
        <UserIcon size={36} color={colors.primarySoftForeground} />
      </View>
      {name ? <Text style={styles.name}>{name}</Text> : null}
      {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}
      <Text style={styles.body}>{t('account.placeholderBody')}</Text>
      <View style={styles.action}>
        <Button variant="secondary" title={t('account.signOut')} onPress={onSignOut} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.xl, backgroundColor: colors.background },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  name: { fontSize: font.heading, fontWeight: weight.bold, color: colors.foreground },
  email: { fontSize: font.base, color: colors.mutedForeground },
  body: { fontSize: font.body, color: colors.mutedForeground, textAlign: 'center', marginTop: space.md },
  action: { alignSelf: 'stretch', marginTop: space.xl },
});
