import {
  productQuerySchema,
  type Category,
  type Product,
  type ProductList,
  type ProductQuery,
} from '@catalogue/contracts';
import { slugifyCategory } from '../categories';
import { ProductNotFoundError, UnknownCategoryError, ValidationError } from '../errors';
import type { IProductRepository } from '../ports/IProductRepository';
import { filterBySearch, normalizeSearchTerm } from '../search';
import { toFieldErrors } from '../validation';

/**
 * Read-side use cases for the catalogue.
 *
 * Depends only on the repository port and shared domain contracts: no HTTP,
 * no vendor SDKs, no database clients.
 */
export class CatalogService {
  constructor(private readonly repository: IProductRepository) {}

  async listProducts(params: ProductQuery = {}): Promise<ProductList> {
    const parsed = productQuerySchema.safeParse(params);
    if (!parsed.success) {
      throw new ValidationError('The product query is invalid.', toFieldErrors(parsed.error));
    }

    const query = parsed.data;
    const search = normalizeSearchTerm(query.search);
    const categorySlug = query.category ? await this.resolveCategorySlug(query.category) : undefined;

    let products = search.length > 0
      ? await this.searchProducts(search)
      : await this.repository.getProducts(categorySlug ? { category: categorySlug } : {});

    if (categorySlug) {
      products = products.filter((product) => product.category === categorySlug);
    }

    const total = products.length;
    const limited = query.limit ? products.slice(0, query.limit) : products;

    return {
      products: limited,
      meta: {
        total,
        category: categorySlug ?? null,
        search: search.length > 0 ? search : null,
      },
    };
  }

  async getProductById(id: string): Promise<Product> {
    const productId = (id ?? '').trim();
    if (productId.length === 0) {
      throw new ValidationError('A product id is required.');
    }

    const product = await this.repository.getProductById(productId);
    if (!product) {
      throw new ProductNotFoundError(productId);
    }

    return product;
  }

  async getCategories(): Promise<Category[]> {
    const categories = await this.repository.getCategories();
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }

  async searchProducts(rawQuery: string): Promise<Product[]> {
    const query = normalizeSearchTerm(rawQuery);
    if (query.length === 0) {
      return [];
    }

    const results = await this.repository.searchProducts(query);
    // Defensive second pass: guarantees token matching regardless of how a
    // future adapter implements search, and drops duplicate ids.
    const seen = new Set<string>();
    return filterBySearch(results, query).filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    });
  }

  async searchProductsByTitle(rawQuery: string): Promise<Product[]> {
    const query = normalizeSearchTerm(rawQuery);
    if (query.length === 0) {
      return [];
    }

    return this.repository.searchProductsByTitle(query);
  }

  private async resolveCategorySlug(input: string): Promise<string> {
    const categories = await this.repository.getCategories();
    const normalized = input.trim().toLowerCase();
    const slug = slugifyCategory(input);

    const match = categories.find(
      (category) => category.slug.toLowerCase() === slug || category.name.toLowerCase() === normalized,
    );

    if (!match) {
      throw new UnknownCategoryError(input);
    }

    return match.slug;
  }
}
