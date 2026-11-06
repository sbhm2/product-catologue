import type { Category, Product, ProductQuery } from '@catalogue/contracts';

/**
 * Port for every product data source.
 *
 * Swapping FakeStore for PostgreSQL/Prisma means adding another implementation
 * of this interface and pointing the composition root at it. Nothing in the
 * business layer needs to change.
 */
export interface IProductRepository {
  getProducts(params?: ProductQuery): Promise<Product[]>;
  getProductById(id: string): Promise<Product | null>;
  getCategories(): Promise<Category[]>;
  searchProducts(query: string): Promise<Product[]>;
  searchProductsByTitle(query: string): Promise<Product[]>;
}
