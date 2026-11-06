import type { Product } from '@catalogue/contracts';
import { productListEnvelopeSchema } from '@catalogue/contracts';
import { request } from './client';

/**
 * Search the catalogue by product title only.
 *
 * This is deliberately separate from the general list/search endpoint because
 * the search-page UX expects two result buckets:
 *   - exact title matches for the current query
 *   - related items that match the catalogue's search criteria but are not
 *     title matches for the current query
 */
export async function searchProductsByTitle(
  query: string,
  limit = 24,
  signal?: AbortSignal,
): Promise<Product[]> {
  const searchParams = new URLSearchParams();
  searchParams.set('search', query.trim());
  if (limit && limit > 0) searchParams.set('limit', String(limit));

  const queryString = searchParams.toString();
  const response = await request(`/api/search${queryString ? `?${queryString}` : ''}`, {
    schema: productListEnvelopeSchema,
    signal,
  });

  return response.data;
}
