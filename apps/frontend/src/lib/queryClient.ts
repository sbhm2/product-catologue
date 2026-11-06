import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/api/client';

function shouldRetry(failureCount: number, error: Error): boolean {
  // Validation, missing resources, and other client errors will not change on
  // retry. Network failures and 5xx responses are worth two more attempts.
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
