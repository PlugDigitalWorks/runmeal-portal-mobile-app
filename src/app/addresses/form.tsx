import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { AddressForm } from '@/components/AddressForm';
import { colors, space } from '@/theme';

/** Adds an address, or edits the one in `?id=`; the title comes from the Stack screen. */
export default function AddressFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AddressForm id={id} onSaved={() => router.back()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.xl },
});
