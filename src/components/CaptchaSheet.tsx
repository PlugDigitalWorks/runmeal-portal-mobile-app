import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Recaptcha } from '@/components/Recaptcha';
import { PORTAL_WEB_ORIGIN } from '@/config';
import { colors, font, space, weight } from '@/theme';

const CAPTCHA_HOST = new URL(PORTAL_WEB_ORIGIN).host;

type Props = {
  visible: boolean;
  /** Called once with the solved token; the owner closes the sheet. */
  onToken: (token: string) => void;
  onClose: () => void;
};

/** The sheet closes the moment a token arrives, so an expiry has nothing left to invalidate. */
const ignoreExpiry = () => undefined;

/**
 * Bottom sheet holding the reCAPTCHA widget, so the 500px challenge stays out of
 * the forms and slides up only when a token is needed. The widget mounts only while the
 * sheet is visible, so every opening gets a fresh one (a token works once).
 */
export function CaptchaSheet({ visible, onToken, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.captchaTitle')}</Text>
          <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button">
            <Text style={styles.close}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <View style={styles.body}>
          {visible ? <Recaptcha host={CAPTCHA_HOST} onToken={onToken} onExpired={ignoreExpiry} /> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.xl },
  title: { flex: 1, fontSize: font.heading, fontWeight: weight.bold, color: colors.foreground },
  close: { fontSize: font.base, fontWeight: weight.semibold, color: colors.primarySoftForeground },
  body: { paddingHorizontal: space.lg },
});
