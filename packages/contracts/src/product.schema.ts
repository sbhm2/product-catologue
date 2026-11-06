import { z } from 'zod';

/**
 * Domain representation of a product.
 *
 * The shape is intentionally source-agnostic: it is produced by whichever
 * `IProductRepository` adapter is wired up (FakeStore today, PostgreSQL
 * tomorrow) and consumed by the API and the React client.
 */
export const stockStatusSchema = z.enum(['in_stock', 'low_stock', 'out_of_stock']);
export type StockStatus = z.infer<typeof stockStatusSchema>;

export const productRatingSchema = z.object({
  rate: z.number().min(0).max(5),
  count: z.number().int().nonnegative(),
});
export type ProductRating = z.infer<typeof productRatingSchema>;

export const productStockSchema = z.object({
  status: stockStatusSchema,
  /** Estimated sellable units. Optional because not every data source tracks inventory. */
  quantity: z.number().int().nonnegative().optional(),
});
export type ProductStock = z.infer<typeof productStockSchema>;

export const productSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  price: z.number().nonnegative(),
  currency: z.literal('USD'),
  category: z.string().min(1),
  categoryLabel: z.string().min(1),
  imageUrl: z.url(),
  rating: productRatingSchema,
  stock: productStockSchema,
});
export type Product = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  productCount: z.number().int().nonnegative(),
});
export type Category = z.infer<typeof categorySchema>;

/**
 * Query contract shared by `GET /api/products` and the client hooks.
 * `limit` is coerced because HTTP query parameters arrive as strings.
 */
export const productQuerySchema = z.object({
  category: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export const productListMetaSchema = z.object({
  total: z.number().int().nonnegative(),
  category: z.string().nullable(),
  search: z.string().nullable(),
});
export type ProductListMeta = z.infer<typeof productListMetaSchema>;

export type ProductList = {
  products: Product[];
  meta: ProductListMeta;
};
