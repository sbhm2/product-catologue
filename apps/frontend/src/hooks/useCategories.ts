import { useCallback, useEffect, useState } from 'react';
import type { Category } from '@catalogue/contracts';
import { listCategories } from '@/api/catalogue';
import { isAbortError, toError } from './errors';

export interface UseCategoriesResult {
  data: Category[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useCategories(): UseCategoriesResult {
  const [data, setData] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoading(true);
    setError(null);

    listCategories(controller.signal)
      .then((categories) => {
        if (!active) return;
        setData(categories);
      })
      .catch((cause: unknown) => {
        if (!active || isAbortError(cause)) return;
        setData([]);
        setError(toError(cause));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [requestKey]);

  const refetch = useCallback(() => {
    setRequestKey((key) => key + 1);
  }, []);

  return { data, isLoading, isError: error !== null, error, refetch };
}
