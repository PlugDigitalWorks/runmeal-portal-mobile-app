type MoneyLocale = 'tr-TR' | 'en-GB';
let locale: MoneyLocale = 'tr-TR';

/** Follows the app language; the currency itself always comes from the API row. */
export function setMoneyLocale(lang: 'tr' | 'en'): void {
  locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
}

export const getMoneyLocale = (): MoneyLocale => locale;

export function formatMoney(value: number | string | null | undefined, currency: string, override?: string): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(override ?? getMoneyLocale(), { style: 'currency', currency, currencyDisplay: 'narrowSymbol' })
    .format(Number.isFinite(amount) ? amount : 0)
    .replace(/\u00a0/g, ' ');
}

/** Whole units for round figures (a minimum basket, a promo amount): "₺250", never "₺250,00". */
export function formatMoneyWhole(value: number | string | null | undefined, currency: string): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(getMoneyLocale(), { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 0 })
    .format(Number.isFinite(amount) ? amount : 0)
    .replace(/ /g, ' ');
}
