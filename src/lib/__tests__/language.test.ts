import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { changeLanguage, detectLanguage, loadLanguage } from '@/lib/language';
import { formatMoney } from '@/lib/money';

describe('language', () => {
  beforeEach(() => AsyncStorage.clear());
  it('detects Turkish from the device locale', () => {
    expect(detectLanguage()).toBe('tr');
  });
  it('persists the choice and switches i18n and money', async () => {
    await changeLanguage('en');
    expect(i18n.language).toBe('en');
    expect(await AsyncStorage.getItem('rm_lang')).toBe('en');
    expect(formatMoney(1, 'GBP')).toBe('£1.00');
    expect(await loadLanguage()).toBe('en');
  });
});
