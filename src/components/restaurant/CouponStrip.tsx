import { BadgePercent } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PromoKey } from '@/mocks/home-mocks';
import { promoAmount } from '@/mocks/home-mocks';
import type { Offer } from '@/mocks/restaurant-mocks';
import { colors, font, radius, space, weight } from '@/theme';
import { MockTag } from '@/ui/MockTag';
import { formatMoney } from '@/lib/money';
import { shortDate } from './format';

export const COUPON_WIDTH = 220;
export const COUPON_HEIGHT = 84;
const STUB = 70;
const STUB_PROMO = 54;
const NOTCH = 12;

type Props = { offers: Offer[]; currency: string; symbol?: string | null };

/**
 * Ticket-style offer cards (Uber / Getir): the big amount on the stub, title and conditions on the right.
 * Every card is a mock and says so; the first one is shown as applied automatically.
 */
export function CouponStrip({ offers, currency, symbol }: Props) {
  if (offers.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {offers.map((offer, index) => (
        <Ticket key={offer.id} offer={offer} currency={currency} symbol={symbol} auto={index === 0} />
      ))}
    </ScrollView>
  );
}

function Ticket({ offer, currency, symbol, auto }: { offer: Offer; currency: string; symbol?: string | null; auto: boolean }) {
  const whole = (value: number) => formatMoney(value, currency, { symbol, whole: true });
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'tr' ? 'tr' : 'en';
  const promo = offer.kind === 'promo';
  const date = offer.endsOn ? shortDate(offer.endsOn, lang) : '';
  const amount = promo ? undefined : offer.kind === 'amount' ? whole(offer.value) : undefined;
  const title = promo ? t(offer.textKey, { amount: whole(promoAmount(offer.promoKey as PromoKey, currency) ?? 0) }) : t(offer.textKey);

  return (
    <View style={[styles.ticket, auto && styles.ticketAuto]}>
      <View style={[styles.stub, promo && styles.stubPromo]}>
        {promo ? (
          <BadgePercent size={30} color={colors.promo} />
        ) : offer.kind === 'amount' ? (
          <>
            <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
              {amount}
            </Text>
            <Text style={styles.amountLabel}>{t('restaurant.coupon.discount')}</Text>
          </>
        ) : (
          <Text style={styles.percent} adjustsFontSizeToFit numberOfLines={3}>
            {t('restaurant.coupon.upTo', { value: offer.value })}
          </Text>
        )}
      </View>
      <View style={styles.divider}>
        <View style={[styles.notch, styles.notchTop]} />
        <View style={[styles.notch, styles.notchBottom]} />
      </View>
      <View style={styles.body}>
        {auto ? <Text style={styles.auto} numberOfLines={1} adjustsFontSizeToFit>{t('restaurant.coupon.auto')}</Text> : null}
        <Text style={styles.title} numberOfLines={promo ? 3 : 1}>
          {title}
        </Text>
        {promo ? null : (
          <Text style={styles.conditions} numberOfLines={2}>
            {offer.minBasket > 0 ? t('restaurant.coupon.conditions', { amount: whole(offer.minBasket), date }) : t('restaurant.coupon.noMin', { date })}
          </Text>
        )}
      </View>
      <View style={styles.tag}>
        <MockTag />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: space.lg, gap: space.sm },
  ticket: { width: COUPON_WIDTH, height: COUPON_HEIGHT, flexDirection: 'row', alignItems: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  ticketAuto: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  stub: { width: STUB, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  stubPromo: { width: STUB_PROMO },
  amount: { fontSize: 22, fontWeight: weight.bold, color: colors.promo },
  amountLabel: { fontSize: font.small, fontWeight: weight.semibold, color: colors.foreground },
  percent: { fontSize: font.base, fontWeight: weight.bold, color: colors.promo, textAlign: 'center' },
  divider: { alignSelf: 'stretch', width: 0, borderLeftWidth: 1, borderLeftColor: colors.subtle, borderStyle: 'dashed' },
  notch: { position: 'absolute', left: -NOTCH / 2 - 0.5, width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  notchTop: { top: -NOTCH / 2 },
  notchBottom: { bottom: -NOTCH / 2 },
  body: { flex: 1, gap: 2, paddingLeft: space.md - 2, paddingRight: space.sm, justifyContent: 'center' },
  auto: { fontSize: font.caption, fontWeight: weight.bold, color: colors.primarySoftForeground },
  title: { fontSize: font.small + 1, fontWeight: weight.bold, color: colors.foreground },
  conditions: { fontSize: font.caption, color: colors.mutedForeground },
  tag: { position: 'absolute', top: 5, left: 7 },
});
