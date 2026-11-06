import { z } from 'zod';
import { productSchema, type Category, type Product, type ProductQuery, type StockStatus } from '@catalogue/contracts';
import { humanizeCategory, slugifyCategory } from '../../business/categories';
import { UpstreamUnavailableError } from '../../business/errors';
import type { ILogger } from '../../business/ports/ILogger';
import type { IProductRepository } from '../../business/ports/IProductRepository';
import { filterBySearch } from '../../business/search';
import { createConsoleLogger } from '../logging/ConsoleLogger';

/**
 * The upstream payload is described separately from the domain `Product`
 * schema. Keeping it here means a change in the vendor contract is contained
 * to this adapter.
 */
const fakeStoreProductSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().min(1),
  price: z.number().finite(),
  description: z.string(),
  category: z.string().min(1),
  image: z.string().min(1),
  rating: z
    .object({
      rate: z.number().min(0).max(5),
      count: z.number().int().nonnegative(),
    })
    .optional(),
});

const fakeStoreProductListSchema = z.array(fakeStoreProductSchema);

type RawFakeStoreProduct = z.infer<typeof fakeStoreProductSchema>;

const DEFAULT_BASE_URL = 'https://fakestoreapi.com';
const DEFAULT_TIMEOUT_MS = 8_000;

export interface FakeStoreAdapterOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  logger?: ILogger;
}

/**
 * FakeStore exposes review counts but not inventory. Until a real inventory
 * feed exists we derive a deterministic stock signal from review volume.
 */
export function deriveStockStatus(rating: { rate: number; count: number } | undefined): StockStatus {
  if (!rating || rating.count <= 0) return 'out_of_stock';
  if (rating.count < 150) return 'low_stock';
  return 'in_stock';
}

/** Maps one raw FakeStore product onto the internal `Product` domain DTO. */
export function normalizeProduct(raw: RawFakeStoreProduct): Product {
  const rating = raw.rating ?? { rate: 0, count: 0 };

  return productSchema.parse({
    id: String(raw.id),
    title: raw.title.trim(),
    description: raw.description.trim(),
    price: raw.price,
    currency: 'USD',
    category: slugifyCategory(raw.category),
    categoryLabel: humanizeCategory(raw.category),
    imageUrl: new URL(raw.image).toString(),
    rating: {
      rate: rating.rate,
      count: rating.count,
    },
    stock: {
      status: deriveStockStatus(rating),
    },
  });
}

function describeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Adapter implementing `IProductRepository` on top of the FakeStore HTTP API.
 *
 * Responsibilities: transport, payload validation, normalization into domain
 * DTOs and translation of transport failures into domain errors.
 */
export class FakeStoreAdapter implements IProductRepository {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly logger: ILogger;

  constructor(options: FakeStoreAdapterOptions = {}) {
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? ((...args) => globalThis.fetch(...args));
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.logger = options.logger ?? createConsoleLogger('fakestore-adapter');
  }

  async getProducts(params: ProductQuery = {}): Promise<Product[]> {
    let products = await this.fetchAllProducts();

    if (params.category) {
      const categorySlug = slugifyCategory(params.category);
      products = products.filter((product) => product.category === categorySlug);
    }

    if (params.search) {
      products = filterBySearch(products, params.search);
    }

    if (params.limit) {
      products = products.slice(0, params.limit);
    }

    return products;
  }

  async getProductById(id: string): Promise<Product | null> {
    const body = await this.requestJson(`/products/${encodeURIComponent(id)}`);
    if (body === null || body === undefined) {
      return null;
    }

    const parsed = fakeStoreProductSchema.safeParse(body);
    if (!parsed.success) {
      this.logger.error('fakestore.product.invalid_payload', {
        id,
        issues: parsed.error.issues.map((issue) => issue.message),
      });
      throw new UpstreamUnavailableError('The product source returned an unexpected product payload.');
    }

    return this.toDomainProduct(parsed.data);
  }

  async getCategories(): Promise<Category[]> {
    const products = await this.fetchAllProducts();
    const categories = new Map<string, Category>();

    for (const product of products) {
      const existing = categories.get(product.category);
      categories.set(product.category, {
        slug: product.category,
        name: product.categoryLabel,
        productCount: (existing?.productCount ?? 0) + 1,
      });
    }

    return [...categories.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async searchProducts(query: string): Promise<Product[]> {
    return this.getProducts({ search: query });
  }

  private async fetchAllProducts(): Promise<Product[]> {
    const body = await this.requestJson('/products');
    const parsed = fakeStoreProductListSchema.safeParse(body);

    if (!parsed.success) {
      this.logger.error('fakestore.products.invalid_payload', {
        issues: parsed.error.issues.slice(0, 5).map((issue) => issue.message),
      });
      throw new UpstreamUnavailableError('The product source returned an unexpected payload.');
    }

    return parsed.data.map((raw) => this.toDomainProduct(raw));
  }

  private toDomainProduct(raw: RawFakeStoreProduct): Product {
    try {
      return normalizeProduct(raw);
    } catch (error) {
      this.logger.error('fakestore.product.normalization_failed', {
        id: String(raw.id),
        reason: describeError(error),
      });
      throw new UpstreamUnavailableError('The product source returned a product that could not be normalized.');
    }
  }

  /**
   * Returns the decoded JSON body, or `null` when the upstream answers 404.
   */
  private async requestJson(path: string): Promise<unknown> {
    const url = `${this.baseUrl}${path}`;

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      this.logger.error('fakestore.request.failed', { url, reason: describeError(error) });
      throw new UpstreamUnavailableError('The product source is currently unreachable.');
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      this.logger.error('fakestore.response.error_status', { url, status: response.status });
      throw new UpstreamUnavailableError(`The product source responded with status ${response.status}.`);
    }

    let text: string;
    try {
      text = await response.text();
    } catch {
      this.logger.error('fakestore.response.unreadable_body', { url });
      throw new UpstreamUnavailableError('The product source returned an unreadable response.');
    }

    // FakeStore answers unknown ids with `200 OK` and an empty body; treat that
    // as "no such product" rather than an upstream failure.
    if (text.trim().length === 0) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch {
      this.logger.error('fakestore.response.invalid_json', { url });
      throw new UpstreamUnavailableError('The product source returned malformed JSON.');
    }
  }
}
