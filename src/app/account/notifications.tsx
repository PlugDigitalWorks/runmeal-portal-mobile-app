import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { loadNotifPrefs, saveNotifPrefs } from '@/lib/notif-prefs';
import { DEFAULT_NOTIF_PREFS, NOTIF_KEYS, type NotifKey, type NotifPrefs } from '@/mocks/account-mocks';
import { colors, font, space, weight } from '@/theme';

/** Four switches kept in AsyncStorage (`rm_notif_prefs`); nothing is wired to push or email yet. */
export default function NotificationsScreen() {
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF_PREFS);
  // A switch flipped before the saved values arrive wins over the late read.
  const touched = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void loadNotifPrefs().then((saved) => {
      if (!cancelled && !touched.current) setPrefs(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (key: NotifKey, value: boolean) => {
    touched.current = true;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    void saveNotifPrefs(next);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.group}>
        {NOTIF_KEYS.map((key) => (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{t(`account.notifications.${key}`)}</Text>
            <Switch
              testID={`notif-${key}`}
              accessibilityLabel={t(`account.notifications.${key}`)}
              value={prefs[key]}
              onValueChange={(value) => toggle(key, value)}
              trackColor={{ true: colors.primary }}
            />
          </View>
        ))}
      </View>
      <Text style={styles.note}>{t('account.notifications.note')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.lg, gap: space.md },
  group: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  label: { flex: 1, fontSize: font.base, fontWeight: weight.semibold, color: colors.foreground },
  note: { fontSize: font.small, color: colors.mutedForeground },
});
