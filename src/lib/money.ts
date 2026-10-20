type MoneyLocale = 'tr-TR' | 'en-GB';
let locale: MoneyLocale = 'tr-TR';

/** Follows the app language; the currency itself always comes from the API row. */
export function setMoneyLocale(lang: 'tr' | 'en'): void {
  locale = lang === 'tr' ? 'tr-TR' : 'en-GB';
}

export const getMoneyLocale = (): MoneyLocale => locale;

type MoneyOptions = {
  /** The API's own symbol ("₺", "£"). Hermes on iOS prints the ISO code ("TRY 300") for some currencies, so a given symbol wins. */
  symbol?: string | null;
  /** Round figures (a minimum basket, a promo amount): no decimals. */
  whole?: boolean;
  /** A locale other than the app language, e.g. for tests. */
  locale?: string;
};

/** Number with the symbol in front: the lira and pound way ("₺1.234,50", "£15"). */
function withSymbol(amount: number, symbol: string, whole: boolean, lang: string): string {
  const digits = whole ? 0 : 2;
  const number = new Intl.NumberFormat(lang, { style: 'decimal', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Math.abs(amount));
  return `${amount < 0 ? '-' : ''}${symbol}${number}`;
}

/** The third argument is the locale (old callers) or an options object. */
export function formatMoney(value: number | string | null | undefined, currency: string, options?: string | MoneyOptions): string {
  const opts: MoneyOptions = typeof options === 'string' ? { locale: options } : (options ?? {});
  const parsed = Number(value ?? 0);
  const amount = Number.isFinite(parsed) ? parsed : 0;
  const lang = opts.locale ?? getMoneyLocale();
  if (opts.symbol) return withSymbol(amount, opts.symbol, !!opts.whole, lang);
  const digits = opts.whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {};
  return new Intl.NumberFormat(lang, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', ...digits })
    .format(amount)
    .replace(/\u00a0/g, ' ');
}

/** Whole units for round figures: "₺250", never "₺250,00". */
export const formatMoneyWhole = (value: number | string | null | undefined, currency: string, symbol?: string | null): string =>
  formatMoney(value, currency, { whole: true, symbol });
