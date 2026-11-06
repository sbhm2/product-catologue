import type { ProductQuery } from '@catalogue/contracts';

/**
 * Query keys live in one place so caching, refetching, and future invalidation
 * all agree on the same identifiers. Keys are hierarchical: invalidating
 * `products.all` also covers every product list and detail query.
 */
export const queryKeys = {
  products: {
    all: ['products'] as const,
    list: ({ category, search, limit }: ProductQuery) =>
      [
        'products',
        'list',
        {
          category: category ?? null,
          search: search ?? null,
          limit: limit ?? null,
        },
      ] as const,
    detail: (id: string) => ['products', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
};
