import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PhotoGrid } from '@/components/PhotoGrid';
import { HERO_PHOTOS } from '@/mocks/home-mocks';
import { colors, radius, space } from '@/theme';
import { MockTag } from '@/ui/MockTag';

/** The big orange banner under the sort/filter row (mock): headline left, 2x2 photo grid right. */
export function HeroBanner() {
  const { t } = useTranslation();
  return (
    <Pressable style={styles.wrap} onPress={() => router.push('/campaigns')} accessibilityRole="button" accessibilityLabel={`${t('home.hero1')} ${t('home.hero2')}`}>
      <View style={styles.banner}>
        <View style={styles.text}>
          <Text style={styles.top} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
            {t('home.hero1')}
          </Text>
          <Text style={styles.bottom} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.7}>
            {t('home.hero2')}
          </Text>
        </View>
        <View style={styles.photos}>
          <PhotoGrid seeds={HERO_PHOTOS} />
        </View>
        <View style={styles.tag}>
          <MockTag />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md },
  banner: { height: 120, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  text: { flex: 58, gap: 4 },
  top: { fontSize: 13, fontWeight: '800', color: colors.primaryForeground },
  bottom: { fontSize: 20, lineHeight: 22, fontWeight: '900', color: colors.foreground },
  photos: { flex: 42, alignSelf: 'stretch' },
  tag: { position: 'absolute', left: 8, bottom: 6 },
});
