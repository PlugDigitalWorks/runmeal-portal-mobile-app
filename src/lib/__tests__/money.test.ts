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

describe('API currency symbol', () => {
  afterEach(() => setMoneyLocale('tr'));
  it('puts the given symbol in front, so the ISO code never shows', () => {
    setMoneyLocale('tr');
    expect(formatMoneyWhole(300, 'TRY', '₺')).toBe('₺300');
    expect(formatMoney(1234.5, 'TRY', { symbol: '₺' })).toBe('₺1.234,50');
    setMoneyLocale('en');
    expect(formatMoneyWhole(15, 'GBP', '£')).toBe('£15');
    expect(formatMoney(1234.5, 'GBP', { symbol: '£' })).toBe('£1,234.50');
  });
  it('keeps the sign in front of the symbol', () => {
    expect(formatMoney(-12, 'TRY', { symbol: '₺' })).toBe('-₺12,00');
  });
  it('falls back to Intl when no symbol is given', () => {
    expect(formatMoneyWhole(300, 'TRY')).toBe('₺300');
    expect(formatMoneyWhole(300, 'TRY', null)).toBe('₺300');
    expect(formatMoney(160, 'GBP', { symbol: undefined })).toBe('£160,00');
  });
  it('still takes a locale string as the third argument', () => {
    expect(formatMoney(1234.5, 'GBP', 'en-GB')).toBe('£1,234.50');
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
