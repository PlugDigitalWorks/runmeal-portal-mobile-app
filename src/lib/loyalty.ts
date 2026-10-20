import type { StampCard } from '@/types/loyalty';

export type PassState = 'collecting' | 'ready' | 'paused';

export type StampProgress = { earned: number; target: number; remaining: number };

/** brandfe's resolveStampProgress: the API counters as sent, clamped only for drawing. */
export function resolveStampProgress(card: StampCard): StampProgress {
  const target = Math.max(1, card.stampThreshold);
  const ready = card.status === 'REWARD_AVAILABLE';
  return {
    earned: ready ? target : Math.max(0, Math.min(card.stampCount, target)),
    target,
    remaining: ready ? 0 : Math.max(0, card.remainingStamps),
  };
}

export function passState(card: StampCard): PassState {
  if (card.status === 'REWARD_AVAILABLE') return 'ready';
  return card.campaignStatus === 'ACTIVE' ? 'collecting' : 'paused';
}

/** Leads with whatever is closest to a reward. */
export function sortCardsByProgress(cards: StampCard[]): StampCard[] {
  const ratio = (card: StampCard) => {
    const { earned, target } = resolveStampProgress(card);
    return earned / target;
  };
  return [...cards].sort((a, b) => ratio(b) - ratio(a));
}
