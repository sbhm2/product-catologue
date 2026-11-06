import { useCallback, useEffect, useState } from 'react';
import type { Product } from '@catalogue/contracts';
import { getProduct } from '@/api/catalogue';
import { ApiError } from '@/api/client';
import { isAbortError, toError } from './errors';

export interface UseProductDetailResult {
  data: Product | null;
  isLoading: boolean;
  isError: boolean;
  notFound: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useProductDetail(id: string | undefined): UseProductDetailResult {
  const [data, setData] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    if (!id) {
      setData(null);
      setError(new Error('A product id is required.'));
      setNotFound(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setError(null);
    setNotFound(false);

    getProduct(id, controller.signal)
      .then((product) => {
        if (!active) return;
        setData(product);
      })
      .catch((cause: unknown) => {
        if (!active || isAbortError(cause)) return;
        setData(null);
        setNotFound(cause instanceof ApiError && cause.code === 'PRODUCT_NOT_FOUND');
        setError(toError(cause));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, requestKey]);

  const refetch = useCallback(() => {
    setRequestKey((key) => key + 1);
  }, []);

  return { data, isLoading, isError: error !== null, notFound, error, refetch };
}
