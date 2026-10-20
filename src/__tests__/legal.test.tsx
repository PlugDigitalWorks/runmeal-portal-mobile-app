import { screen } from '@testing-library/react-native';
import LegalScreen from '@/app/legal/[page]';
import { legalDocument, type LegalPage } from '@/content/legal';
import { renderWithProviders } from './helpers/render-with-providers';

const mockParams: { page?: string } = {};
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }));

it.each([
  ['tr', 'privacy'],
  ['tr', 'terms'],
  ['en', 'privacy'],
  ['en', 'terms'],
] as const)('names PLUG DIGITAL LTD and without any company suffix other than LTD (%s %s)', (lang, page: LegalPage) => {
  const text = JSON.stringify(legalDocument(page, lang));
  expect(text).toContain('PLUG DIGITAL LTD (');
  expect(text).toContain('info@plugdigital.co.uk');
  expect(text).not.toMatch(/works/i);
  expect(text).not.toContain('{{');
});

it('shows the privacy policy in the app language', async () => {
  mockParams.page = 'privacy';
  await renderWithProviders(<LegalScreen />);
  expect(screen.getByText('Son güncelleme 21 Ekim 2026')).toBeTruthy();
  expect(screen.getByText('Konum')).toBeTruthy();
  expect(screen.getAllByText(/PLUG DIGITAL LTD/).length).toBeGreaterThan(0);
});

it('shows the terms of use for /legal/terms', async () => {
  mockParams.page = 'terms';
  await renderWithProviders(<LegalScreen />);
  expect(screen.getByText('Alerji ve beslenme ihtiyaçları')).toBeTruthy();
  expect(screen.queryByText(/works/i)).toBeNull();
});
