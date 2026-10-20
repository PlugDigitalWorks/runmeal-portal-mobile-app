import { focusManager, QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { AppState, type AppStateStatus } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // A 4xx will not change on retry; one retry covers a flaky network.
      retry: (count, error) => !(error instanceof AxiosError && (error.response?.status ?? 0) >= 400 && (error.response?.status ?? 0) < 500) && count < 1,
    },
  },
});

/** React Native has no window focus: coming back to the app refetches stale queries. */
export function bindAppFocus(): () => void {
  const sub = AppState.addEventListener('change', (state: AppStateStatus) => focusManager.setFocused(state === 'active'));
  return () => sub.remove();
}
