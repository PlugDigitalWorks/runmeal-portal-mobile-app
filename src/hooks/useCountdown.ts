import { useFocusEffect } from 'expo-router';
import { useCallback, useSyncExternalStore } from 'react';
import { acquireCountdown, countdownParts, getCountdown, subscribeCountdown } from '@/lib/countdown';

/** Seconds left on the shared mock countdown, ticking only while the calling screen is focused. */
export function useCountdown() {
  useFocusEffect(useCallback(() => acquireCountdown(), []));
  const left = useSyncExternalStore(subscribeCountdown, getCountdown);
  return { left, ...countdownParts(left) };
}
