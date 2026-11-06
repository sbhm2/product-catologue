import { useCallback, useEffect, useState } from 'react';
import type { Product, ProductListMeta, ProductQuery } from '@catalogue/contracts';
import { listProducts } from '@/api/catalogue';
import { isAbortError, toError } from './errors';

export interface UseProductsResult {
  data: Product[];
  meta: ProductListMeta | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetches a product list for the given query. Presentation components stay
 * headless: they receive `data` and states from this hook.
 */
export function useProducts(params: ProductQuery = {}): UseProductsResult {
  const { category, search, limit } = params;
  const [data, setData] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductListMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setError(null);

    listProducts({ category, search, limit }, controller.signal)
      .then((result) => {
        if (!active) return;
        setData(result.data);
        setMeta(result.meta);
      })
      .catch((cause: unknown) => {
        if (!active || isAbortError(cause)) return;
        setData([]);
        setMeta(null);
        setError(toError(cause));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [category, search, limit, requestKey]);

  const refetch = useCallback(() => {
    setRequestKey((key) => key + 1);
  }, []);

  return { data, meta, isLoading, isError: error !== null, error, refetch };
}
