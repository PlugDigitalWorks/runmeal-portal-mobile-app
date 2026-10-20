export interface StampQr {
  qrToken: string;
  /** What the cashier scans. */
  qrValue: string;
}

export interface StampCard {
  campaignId: string;
  campaignName: string;
  brandId: string;
  category: { id: string; name: string };
  stampThreshold: number;
  campaignStatus: 'ACTIVE' | 'INACTIVE';
  stampCount: number;
  remainingStamps: number;
  status: 'COLLECTING' | 'REWARD_AVAILABLE';
  rewardExpiresAt: string | null;
}
