import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import '@/i18n';

/** Renders under a fresh query client (no retries, no cache between tests; finished mutations are dropped at once so their 5-minute gc timer cannot keep Jest alive); returns the client for assertions.
 * Testing Library v14 renders asynchronously, so this must be awaited. */
export async function renderWithProviders(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } } });
  return { client, ...(await render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)) };
}
