import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { CouponStrip } from '@/components/restaurant/CouponStrip';
import { SHOW_MOCKS } from '@/config';
import { formatCredit } from '@/lib/credit';
import { MOCK_COUPONS } from '@/mocks/account-mocks';
import { useCreditBalance } from '@/queries/useCreditBalance';
import { colors, font, radius, space, weight } from '@/theme';
import { Button } from '@/ui/Button';
import { TextField } from '@/ui/TextField';

/** The Runmeal credit (real, GET /loyalty/credit/balance) above sample coupons (Mock) and a code field that only says it is coming. */
export default function CouponsScreen() {
  const { t } = useTranslation();
  const { data: credit } = useCreditBalance();
  const [code, setCode] = useState('');

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {credit !== undefined ? (
        <View style={styles.credit}>
          <Text style={styles.creditTitle}>{t('account.coupons.credit', { amount: formatCredit(credit) })}</Text>
          <Text style={styles.creditBody}>{t('account.coupons.creditBody')}</Text>
        </View>
      ) : null}
      {SHOW_MOCKS ? (
        <>
          <Text style={styles.heading}>{t('account.coupons.listTitle')}</Text>
          <View style={styles.strip}>
            <CouponStrip offers={MOCK_COUPONS} currency="TRY" symbol="₺" />
          </View>
          <View style={styles.codeBox}>
            <TextField label={t('account.coupons.addLabel')} value={code} onChangeText={setCode} placeholder={t('account.coupons.codePlaceholder')} autoCapitalize="characters" />
            <Button variant="secondary" title={t('account.coupons.add')} onPress={() => Alert.alert(t('account.coupons.addSoon'))} />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingVertical: space.lg, gap: space.lg },
  credit: { marginHorizontal: space.lg, padding: space.lg, gap: 4, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  creditTitle: { fontSize: font.title, fontWeight: weight.bold, color: colors.foreground },
  creditBody: { fontSize: font.body, color: colors.mutedForeground },
  heading: { paddingHorizontal: space.lg, fontSize: font.base, fontWeight: weight.bold, color: colors.foreground },
  strip: { marginTop: -space.sm },
  codeBox: { marginHorizontal: space.lg, gap: space.md },
});
