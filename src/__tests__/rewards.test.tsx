import { screen } from '@testing-library/react-native';
import RewardsScreen from '@/app/rewards';
import { getStampCards } from '@/services/loyalty.service';
import { getMyOrders } from '@/services/order.service';
import type { StampCard } from '@/types/loyalty';
import { renderWithProviders } from './helpers/render-with-providers';

jest.mock('@/services/order.service', () => ({ getMyOrders: jest.fn() }));
jest.mock('@/services/loyalty.service', () => ({ getStampCards: jest.fn() }));

const card = (over: Partial<StampCard>): StampCard => ({
  campaignId: 'c1',
  campaignName: 'Kahve kartı',
  brandId: 'b1',
  category: { id: 'k', name: 'Kahve' },
  stampThreshold: 10,
  campaignStatus: 'ACTIVE',
  stampCount: 3,
  remainingStamps: 7,
  status: 'COLLECTING',
  rewardExpiresAt: null,
  ...over,
});

beforeEach(() => jest.clearAllMocks());

it('asks once per brand the person ordered from and lists the cards with their progress', async () => {
  (getMyOrders as jest.Mock).mockResolvedValue([{ brandId: 'b1' }, { brandId: 'b2' }, { brandId: 'b1' }]);
  (getStampCards as jest.Mock).mockImplementation(async (brandId: string) =>
    brandId === 'b1' ? [card({})] : [card({ campaignId: 'c2', campaignName: 'Burger kartı', stampCount: 9, stampThreshold: 10, remainingStamps: 1 })],
  );
  await renderWithProviders(<RewardsScreen />);
  expect(await screen.findByText('3/10 damga')).toBeTruthy();
  expect(screen.getByText('9/10 damga')).toBeTruthy();
  expect(screen.getByText('Ödüle 7 damga kaldı')).toBeTruthy();
  expect(getStampCards).toHaveBeenCalledTimes(2);
  expect(getStampCards).toHaveBeenCalledWith('b1');
  expect(getStampCards).toHaveBeenCalledWith('b2');
});

it('says so when there are no stamp cards', async () => {
  (getMyOrders as jest.Mock).mockResolvedValue([{ brandId: 'b1' }]);
  (getStampCards as jest.Mock).mockResolvedValue([]);
  await renderWithProviders(<RewardsScreen />);
  expect(await screen.findByText('Henüz damga kartın yok')).toBeTruthy();
});

it('marks a full card as ready', async () => {
  (getMyOrders as jest.Mock).mockResolvedValue([{ brandId: 'b1' }]);
  (getStampCards as jest.Mock).mockResolvedValue([card({ status: 'REWARD_AVAILABLE', stampCount: 10, remainingStamps: 0 })]);
  await renderWithProviders(<RewardsScreen />);
  expect(await screen.findByText('Ödülün hazır')).toBeTruthy();
  expect(screen.getByText('10/10 damga')).toBeTruthy();
});

it('shows the error state with a retry when the orders cannot be read', async () => {
  (getMyOrders as jest.Mock).mockRejectedValue(new Error('offline'));
  await renderWithProviders(<RewardsScreen />);
  expect(await screen.findByText('Ödüller yüklenemedi.')).toBeTruthy();
  expect(screen.getByText('Tekrar dene')).toBeTruthy();
});
