import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Category } from '@catalogue/contracts';
import { listCategories } from '@/api/catalogue';
import { queryKeys } from '@/lib/queryKeys';
import { toError } from './errors';

export interface UseCategoriesResult {
  data: Category[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCategories(): UseCategoriesResult {
  const query = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: ({ signal }) => listCategories(signal),
  });

  const { refetch: refetchQuery } = query;
  const refetch = useCallback(() => {
    void refetchQuery();
  }, [refetchQuery]);

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? toError(query.error) : null,
    refetch,
  };
}
