import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoImage } from '@/components/PhotoImage';
import { SHOW_MOCKS } from '@/config';
import type { Campaign } from '@/mocks/home-mocks';
import { colors, radius, weight } from '@/theme';
import { MockTag } from '@/ui/MockTag';

type Props = { campaign: Campaign; height: number; /** Fixed width inside the horizontal row; omit to fill the parent. */ width?: number };

const WHITE = colors.primaryForeground;

/**
 * The poster of one (mock) campaign, drawn in code on a solid colour with placeholder photos. A
 * `collage` has the headline on the left and a 2x2 photo grid on the right; a `single` is one photo
 * under a tint with the amount in the middle. Type scales with the height so the same poster serves
 * the carousel (170) and the detail screen (220).
 */
export function CampaignArt({ campaign, height, width }: Props) {
  const { t } = useTranslation();
  const k = `campaigns.items.${campaign.id}`;
  const s = height / 170;
  return (
    <View style={[styles.poster, { height, backgroundColor: campaign.color }, width ? { width } : null]}>
      {campaign.layout === 'collage' ? (
        <View style={[styles.collage, { padding: 14 * s }]}>
          <View style={styles.text}>
            <Text style={[styles.headline, { fontSize: 22 * s, lineHeight: 24 * s }]} numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.7}>
              {t(`${k}.headline`)}
            </Text>
            <Text style={[styles.sub, { fontSize: 11 * s }]} numberOfLines={2}>
              {t(`${k}.subtitle`)}
            </Text>
          </View>
          <View style={styles.photos}>
            <PhotoGrid seeds={campaign.photos} />
          </View>
        </View>
      ) : (
        <>
          <PhotoImage seed={campaign.photos[0]} width={640} height={480} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: campaign.color, opacity: 0.3 }]} />
          <View style={[StyleSheet.absoluteFill, styles.dark]} />
          <View style={styles.center}>
            <Text style={[styles.amount, { fontSize: 44 * s }]} adjustsFontSizeToFit numberOfLines={1}>
              {t(`${k}.headline`)}
            </Text>
            <Text style={[styles.caption, { fontSize: 14 * s }]}>{t(`${k}.caption`)}</Text>
          </View>
          <View style={[styles.dates, { top: 10 * s, right: 10 * s }]}>
            <Text style={[styles.datesText, { fontSize: 11 * s }]}>{t(`${k}.dates`)}</Text>
          </View>
        </>
      )}
      {SHOW_MOCKS ? (
        <View style={styles.tag}>
          <MockTag />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  poster: { borderRadius: radius.lg, overflow: 'hidden' },
  collage: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { flex: 55, gap: 6 },
  photos: { flex: 45, alignSelf: 'stretch' },
  headline: { fontWeight: '800', color: WHITE },
  sub: { color: WHITE, opacity: 0.85 },
  dark: { backgroundColor: 'rgba(16,25,46,0.35)' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  amount: { fontWeight: '900', color: WHITE, textShadowColor: 'rgba(0,0,0,0.25)', textShadowRadius: 6 },
  caption: { fontWeight: '800', color: WHITE, letterSpacing: 0.5 },
  dates: { position: 'absolute', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full, backgroundColor: '#FFD84D' },
  datesText: { fontWeight: weight.bold, color: colors.foreground },
  tag: { position: 'absolute', left: 8, bottom: 8 },
});
