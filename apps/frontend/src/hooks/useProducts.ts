import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product, ProductListMeta, ProductQuery } from '@catalogue/contracts';
import { listProducts } from '@/api/catalogue';
import { queryKeys } from '@/lib/queryKeys';
import { toError } from './errors';

export interface UseProductsResult {
  data: Product[];
  meta: ProductListMeta | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches a product list for the given query. TanStack Query owns caching,
 * request deduplication, cancellation, and retries; components keep receiving
 * the same presentation-friendly result.
 */
export function useProducts(params: ProductQuery = {}): UseProductsResult {
  const { category, search, limit } = params;

  const query = useQuery({
    queryKey: queryKeys.products.list({ category, search, limit }),
    queryFn: ({ signal }) => listProducts({ category, search, limit }, signal),
  });

  const { refetch: refetchQuery } = query;
  const refetch = useCallback(() => {
    void refetchQuery();
  }, [refetchQuery]);

  return {
    data: query.data?.data ?? [],
    meta: query.data?.meta ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? toError(query.error) : null,
    refetch,
  };
}
