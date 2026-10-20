import { formatMoney } from './money';

/** GET /loyalty/credit/balance answers only `{ balance }`, no currency: Runmeal credit is assumed to be lira everywhere it is shown. */
export const formatCredit = (balance: number): string => formatMoney(balance, 'TRY', { symbol: '₺' });
