import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { NotAvailable } from '@/components/account/NotAvailable';
import { RatingMark } from '@/components/restaurant/RatingMark';
import { SHOW_MOCKS } from '@/config';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from '@/ui/Button';

const RATINGS = [1, 2, 3, 4, 5] as const;

/** Feedback form, a labelled mock: nothing is sent anywhere. Five Runmeal logos stand in for stars. */
export default function FeedbackScreen() {
  // Mock data only: a build without mocks reached here by deep link shows nothing fake.
  return SHOW_MOCKS ? <FeedbackMock /> : <NotAvailable />;
}

function FeedbackMock() {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const send = () => {
    Alert.alert(t('account.feedback.thanks'));
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.question}>{t('account.feedback.question')}</Text>
        <View style={styles.rating}>
          {RATINGS.map((value) => (
            <Pressable
              key={value}
              testID={`feedback-rate-${value}`}
              onPress={() => setRating(value)}
              accessibilityRole="button"
              accessibilityLabel={t('account.feedback.rate', { count: value })}
              accessibilityState={{ selected: value <= rating }}
            >
              <RatingMark size={48} dim={value > rating} />
            </Pressable>
          ))}
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>{t('account.feedback.comment')}</Text>
          <TextInput
            accessibilityLabel={t('account.feedback.comment')}
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder={t('account.feedback.commentPlaceholder')}
            placeholderTextColor={colors.subtle}
            multiline
            textAlignVertical="top"
          />
        </View>
        <Button title={t('account.feedback.send')} onPress={send} disabled={rating === 0} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.lg },
  question: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground, textAlign: 'center' },
  rating: { flexDirection: 'row', justifyContent: 'center', gap: space.md },
  field: { gap: 6 },
  label: { fontSize: font.small, fontWeight: weight.semibold, color: colors.mutedForeground },
  input: { minHeight: 120, padding: space.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, fontSize: font.base, color: colors.foreground },
});
