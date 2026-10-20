import { screen } from '@testing-library/react-native';
import { RatingPill } from '@/ui/RatingPill';
import { renderWithProviders } from './helpers/render-with-providers';

it('shows the rating with one decimal and the review count', async () => {
  await renderWithProviders(<RatingPill rating={4.8} count={1500} />);
  expect(screen.getByText('4.8 (1500+)')).toBeTruthy();
});

it('has a medium size for the restaurant page', async () => {
  await renderWithProviders(<RatingPill rating={4} count={70} size="md" />);
  expect(screen.getByText('4.0 (70+)')).toBeTruthy();
});
