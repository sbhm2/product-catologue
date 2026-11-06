import type { Product, ProductListMeta } from '@catalogue/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '1',
    title: 'Fjallraven - Foldsack No. 1 Backpack',
    description: 'Your perfect pack for everyday use and walks in the forest.',
    price: 109.95,
    currency: 'USD',
    category: 'mens-clothing',
    categoryLabel: "Men's Clothing",
    imageUrl: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
    rating: { rate: 3.9, count: 120 },
    stock: { status: 'low_stock' },
    ...overrides,
  };
}

export const testProduct = makeProduct();

export const testMeta: ProductListMeta = {
  total: 1,
  category: null,
  search: null,
};

/**
 * Each test gets an isolated client: no retries (so failure tests resolve
 * immediately) and an infinite cache lifetime (so unmounted hooks remain
 * inspectable for cache assertions).
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function createQueryWrapper() {
  const client = createTestQueryClient();

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

export function renderQueryHook<Result>(hook: () => Result) {
  return renderHook(hook, { wrapper: createQueryWrapper() });
}

export function renderWithRouter(
  ui: ReactElement,
  { route = '/' }: { route?: string } = {},
): RenderResult {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}
