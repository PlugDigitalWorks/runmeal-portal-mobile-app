import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { AddressForm } from '@/components/AddressForm';
import { colors, font, space, weight } from '@/theme';
import { Screen } from '@/ui/Screen';

/** First run: restaurants are listed around a delivery address, so nothing opens before there is one. */
export default function OnboardingAddress() {
  const { t } = useTranslation();
  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{t('addresses.onboardingTitle')}</Text>
          <Text style={styles.subtitle}>{t('addresses.onboardingSubtitle')}</Text>
          <AddressForm onSaved={() => router.replace('/(tabs)')} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: space.xl, gap: space.md },
  title: { fontSize: font.display, fontWeight: weight.bold, color: colors.foreground },
  subtitle: { fontSize: font.base, color: colors.mutedForeground, marginBottom: space.sm },
});
