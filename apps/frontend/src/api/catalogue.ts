import {
  categoryListEnvelopeSchema,
  productEnvelopeSchema,
  productListEnvelopeSchema,
  type Category,
  type Product,
  type ProductListEnvelope,
  type ProductQuery,
} from '@catalogue/contracts';
import { request } from './client';

export async function listProducts(
  params: ProductQuery = {},
  signal?: AbortSignal,
): Promise<ProductListEnvelope> {
  const searchParams = new URLSearchParams();
  if (params.category) searchParams.set('category', params.category);
  if (params.search) searchParams.set('search', params.search);
  if (params.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return request(`/api/products${query ? `?${query}` : ''}`, {
    schema: productListEnvelopeSchema,
    signal,
  });
}

export async function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  const { data } = await request(`/api/products/${encodeURIComponent(id)}`, {
    schema: productEnvelopeSchema,
    signal,
  });
  return data;
}

export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  const { data } = await request('/api/categories', {
    schema: categoryListEnvelopeSchema,
    signal,
  });
  return data;
}
