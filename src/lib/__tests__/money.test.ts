import { formatMoney, formatMoneyWhole, setMoneyLocale } from '@/lib/money';

describe('formatMoney', () => {
  afterEach(() => setMoneyLocale('tr'));
  it('formats with the API currency in Turkish', () => {
    setMoneyLocale('tr');
    expect(formatMoney(1234.5, 'TRY')).toBe('₺1.234,50');
    expect(formatMoney(160, 'GBP')).toBe('£160,00');
  });
  it('formats in English', () => {
    setMoneyLocale('en');
    expect(formatMoney(1234.5, 'GBP')).toBe('£1,234.50');
  });
  it('treats junk as zero', () => {
    expect(formatMoney('abc', 'TRY')).toBe('₺0,00');
    expect(formatMoney(null, 'TRY')).toBe('₺0,00');
  });
});

describe('formatMoneyWhole', () => {
  afterEach(() => setMoneyLocale('tr'));
  it('drops the decimals and keeps the branch currency', () => {
    setMoneyLocale('tr');
    expect(formatMoneyWhole(250, 'TRY')).toBe('₺250');
    expect(formatMoneyWhole('500.00', 'GBP')).toBe('£500');
    setMoneyLocale('en');
    expect(formatMoneyWhole(1200, 'EUR')).toBe('€1,200');
  });
  it('treats junk as zero', () => {
    expect(formatMoneyWhole(null, 'TRY')).toBe('₺0');
  });
});
