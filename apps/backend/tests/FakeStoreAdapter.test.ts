import { productSchema } from '@catalogue/contracts';
import { DomainError } from '../src/business/errors';
import {
  FakeStoreAdapter,
  deriveStockStatus,
  normalizeProduct,
} from '../src/data-access/fakestore/FakeStoreAdapter';
import { makeRawFakeStoreProduct } from './fixtures/products';
import { createRecordingLogger } from './helpers';

const BASE_URL = 'https://fakestore.test';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function setup(fetchImpl: jest.Mock) {
  const logger = createRecordingLogger();
  const adapter = new FakeStoreAdapter({
    baseUrl: `${BASE_URL}/`,
    fetchImpl: fetchImpl as unknown as typeof fetch,
    timeoutMs: 500,
    logger,
  });

  return { adapter, logger };
}

function requestUrl(fetchImpl: jest.Mock, call = 0): string {
  return String(fetchImpl.mock.calls[call]?.[0]);
}

describe('deriveStockStatus', () => {
  it('derives a deterministic stock signal from review volume', () => {
    expect(deriveStockStatus(undefined)).toBe('out_of_stock');
    expect(deriveStockStatus({ rate: 0, count: 0 })).toBe('out_of_stock');
    expect(deriveStockStatus({ rate: 4, count: 149 })).toBe('low_stock');
    expect(deriveStockStatus({ rate: 4, count: 150 })).toBe('in_stock');
  });
});

describe('normalizeProduct', () => {
  it('maps the vendor payload onto the domain Product shape', () => {
    const product = normalizeProduct(
      makeRawFakeStoreProduct({
        title: '  Fjallraven - Foldsack No. 1 Backpack  ',
        category: "men's clothing",
      }),
    );

    expect(product).toEqual({
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
    });
    expect(productSchema.safeParse(product).success).toBe(true);
  });

  it('handles payloads without ratings', () => {
    const raw = makeRawFakeStoreProduct({ rating: undefined });
    const product = normalizeProduct(raw);

    expect(product.rating).toEqual({ rate: 0, count: 0 });
    expect(product.stock.status).toBe('out_of_stock');
  });

  it('rejects payloads whose image is not a URL', () => {
    expect(() => normalizeProduct(makeRawFakeStoreProduct({ image: 'not-a-url' }))).toThrow();
  });
});

describe('FakeStoreAdapter', () => {
  it('fetches and normalizes the product list', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([
        makeRawFakeStoreProduct({ id: 1 }),
        makeRawFakeStoreProduct({
          id: 2,
          title: 'Solid Gold Petite Micropave',
          category: 'jewelery',
          rating: { rate: 4.6, count: 400 },
        }),
      ]),
    );
    const { adapter } = setup(fetchImpl);

    const products = await adapter.getProducts();

    expect(requestUrl(fetchImpl)).toBe(`${BASE_URL}/products`);
    expect(products).toHaveLength(2);
    expect(products[1]).toMatchObject({
      id: '2',
      category: 'jewelery',
      categoryLabel: 'Jewelery',
      stock: { status: 'in_stock' },
    });
  });

  it('filters by a human readable category name', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([
        makeRawFakeStoreProduct({ id: 1, category: "men's clothing" }),
        makeRawFakeStoreProduct({ id: 2, title: 'Ring', category: 'jewelery' }),
      ]),
    );
    const { adapter } = setup(fetchImpl);

    const products = await adapter.getProducts({ category: 'Jewelery' });

    expect(products.map((product) => product.id)).toEqual(['2']);
  });

  it('filters by search tokens and applies the limit', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([
        makeRawFakeStoreProduct({ id: 1, title: 'Fjallraven Backpack' }),
        makeRawFakeStoreProduct({ id: 2, title: 'Solid Gold Ring' }),
        makeRawFakeStoreProduct({ id: 3, title: 'Backpack Rain Cover' }),
      ]),
    );
    const { adapter } = setup(fetchImpl);

    const products = await adapter.getProducts({ search: 'backpack', limit: 1 });

    expect(products).toHaveLength(1);
    expect(products[0]?.title).toBe('Fjallraven Backpack');
  });

  it('aggregates categories with counts, sorted by name', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([
        makeRawFakeStoreProduct({ id: 1, category: "men's clothing" }),
        makeRawFakeStoreProduct({ id: 2, category: 'jewelery' }),
        makeRawFakeStoreProduct({ id: 3, category: "men's clothing" }),
      ]),
    );
    const { adapter } = setup(fetchImpl);

    const categories = await adapter.getCategories();

    expect(categories).toEqual([
      { slug: 'jewelery', name: 'Jewelery', productCount: 1 },
      { slug: 'mens-clothing', name: "Men's Clothing", productCount: 2 },
    ]);
  });

  it('returns a single product by id', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValue(jsonResponse(makeRawFakeStoreProduct({ id: 7 })));
    const { adapter } = setup(fetchImpl);

    const product = await adapter.getProductById('7');

    expect(requestUrl(fetchImpl)).toBe(`${BASE_URL}/products/7`);
    expect(product?.id).toBe('7');
  });

  it('returns null when the product does not exist upstream', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(null, 404));
    const { adapter } = setup(fetchImpl);

    await expect(adapter.getProductById('999')).resolves.toBeNull();
  });

  it('treats an empty 200 body as a missing product', async () => {
    // FakeStore answers unknown ids with `200 OK` and `content-length: 0`.
    const fetchImpl = jest.fn().mockResolvedValue(new Response('', { status: 200 }));
    const { adapter } = setup(fetchImpl);

    await expect(adapter.getProductById('999')).resolves.toBeNull();
  });

  it('translates HTTP failures into an UpstreamUnavailableError', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse({ message: 'nope' }, 500));
    const { adapter, logger } = setup(fetchImpl);

    const error = await adapter.getProducts().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
    expect(logger.error).toHaveBeenCalledWith(
      'fakestore.response.error_status',
      expect.objectContaining({ status: 500 }),
    );
  });

  it('translates network failures into an UpstreamUnavailableError', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    const { adapter } = setup(fetchImpl);

    await expect(adapter.getProducts()).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('rejects malformed JSON', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response('<html>oops</html>', { status: 200 }));
    const { adapter } = setup(fetchImpl);

    await expect(adapter.getProducts()).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('rejects a payload that does not match the vendor contract', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse([{ id: 1, title: 'Missing fields' }]));
    const { adapter } = setup(fetchImpl);

    await expect(adapter.getProducts()).rejects.toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });

  it('delegates searchProducts to the product endpoint', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      jsonResponse([makeRawFakeStoreProduct({ id: 1, title: 'Fjallraven Backpack' })]),
    );
    const { adapter } = setup(fetchImpl);

    const products = await adapter.searchProducts('backpack');

    expect(requestUrl(fetchImpl)).toBe(`${BASE_URL}/products`);
    expect(products.map((product) => product.id)).toEqual(['1']);
  });
});
