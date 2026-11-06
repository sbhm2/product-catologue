import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Product } from '@catalogue/contracts';
import { getProduct } from '@/api/catalogue';
import { ApiError } from '@/api/client';
import { queryKeys } from '@/lib/queryKeys';
import { toError } from './errors';

export interface UseProductDetailResult {
  data: Product | null;
  isLoading: boolean;
  isError: boolean;
  notFound: boolean;
  error: Error | null;
  refetch: () => void;
}

const MISSING_ID_ERROR = new Error('A product id is required.');

export function useProductDetail(id: string | undefined): UseProductDetailResult {
  const query = useQuery({
    queryKey: queryKeys.products.detail(id ?? ''),
    queryFn: ({ signal }) => {
      if (!id) throw MISSING_ID_ERROR;
      return getProduct(id, signal);
    },
    enabled: Boolean(id),
  });

  const { refetch: refetchQuery } = query;
  const refetch = useCallback(() => {
    void refetchQuery();
  }, [refetchQuery]);

  if (!id) {
    return {
      data: null,
      isLoading: false,
      isError: true,
      notFound: false,
      error: MISSING_ID_ERROR,
      refetch,
    };
  }

  const error = query.error ? toError(query.error) : null;

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    notFound: error instanceof ApiError && error.code === 'PRODUCT_NOT_FOUND',
    error,
    refetch,
  };
}
