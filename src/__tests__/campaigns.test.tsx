import { fireEvent, screen } from '@testing-library/react-native';
import CampaignDetail from '@/app/campaigns/[id]';
import { CampaignsScreen } from '@/components/CampaignsScreen';
import { renderWithProviders } from './helpers/render-with-providers';

const mockPush = jest.fn();
const mockNavigate = jest.fn();
let mockShowMocks = true;
let mockId = 'pizza2for1';
jest.mock('expo-router', () => ({
  router: { push: (p: unknown) => mockPush(p), navigate: (p: unknown) => mockNavigate(p) },
  Stack: { Screen: () => null },
  useLocalSearchParams: () => ({ id: mockId }),
}));
jest.mock('@/config', () => {
  const config = { ...jest.requireActual('@/config') };
  Object.defineProperty(config, 'SHOW_MOCKS', { get: () => mockShowMocks });
  return config;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockShowMocks = true;
  mockId = 'pizza2for1';
});

describe('campaigns tab', () => {
  it('lists the five labelled mock campaigns and opens one', async () => {
    await renderWithProviders(<CampaignsScreen />);
    expect(screen.getByText('Kampanyalar (5) (Mock)')).toBeTruthy();
    expect(screen.getByLabelText('Kahvede ikincisi %50')).toBeTruthy();
    expect(screen.getByText('2 AL 1 ÖDE PİZZA')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('2 al 1 öde pizza'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/campaigns/[id]', params: { id: 'pizza2for1' } });
  });

  it('is an empty state when mocks are off', async () => {
    mockShowMocks = false;
    await renderWithProviders(<CampaignsScreen />);
    expect(screen.getByText('Şu an kampanya yok')).toBeTruthy();
    expect(screen.queryByText(/Mock/)).toBeNull();
  });
});

describe('campaign detail', () => {
  it('shows the description, the sample note and leads back to the restaurants', async () => {
    await renderWithProviders(<CampaignDetail />);
    expect(screen.getByText('2 al 1 öde pizza')).toBeTruthy();
    expect(screen.getByText('2 AL 1 ÖDE PİZZA')).toBeTruthy();
    expect(screen.getByText('Bu kampanya örnek gösterimdir (Mock).')).toBeTruthy();
    await fireEvent.press(screen.getByText('Restoranlara göz at'));
    expect(mockNavigate).toHaveBeenCalledWith('/(tabs)');
  });

  it('is not available with mocks off', async () => {
    mockShowMocks = false;
    await renderWithProviders(<CampaignDetail />);
    expect(screen.getByText('Bu kampanya bulunamadı')).toBeTruthy();
    expect(screen.queryByText('2 AL 1 ÖDE PİZZA')).toBeNull();
  });

  it('says so for an unknown campaign', async () => {
    mockId = 'nope';
    await renderWithProviders(<CampaignDetail />);
    expect(screen.getByText('Bu kampanya bulunamadı')).toBeTruthy();
  });
});
