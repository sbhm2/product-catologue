import { CatalogService } from '../src/business/services/CatalogService';
import { backpack, goldRing, headphones } from './fixtures/products';
import { asRepository, createMockRepository } from './helpers';

function setup(overrides: Parameters<typeof createMockRepository>[0] = {}) {
  const repository = createMockRepository(overrides);
  const service = new CatalogService(asRepository(repository));
  return { repository, service };
}

describe('CatalogService.listProducts', () => {
  it('returns every product with a meta summary', async () => {
    const { repository, service } = setup();

    const result = await service.listProducts();

    expect(repository.getProducts).toHaveBeenCalledWith({});
    expect(result.products).toEqual([backpack, goldRing, headphones]);
    expect(result.meta).toEqual({ total: 3, category: null, search: null });
  });

  it('resolves a category name to its slug before querying', async () => {
    const { repository, service } = setup();

    const result = await service.listProducts({ category: "Men's Clothing" });

    expect(repository.getProducts).toHaveBeenCalledWith({ category: 'mens-clothing' });
    expect(result.products).toEqual([backpack]);
    expect(result.meta.category).toBe('mens-clothing');
  });

  it('rejects an unknown category without querying products', async () => {
    const { repository, service } = setup();

    await expect(service.listProducts({ category: 'garden' })).rejects.toMatchObject({
      code: 'UNKNOWN_CATEGORY',
    });
    expect(repository.getProducts).not.toHaveBeenCalled();
  });

  it('combines repository search with a defensive token filter', async () => {
    const repository = createMockRepository({
      searchProducts: jest.fn().mockResolvedValue([backpack, goldRing]),
    });
    const service = new CatalogService(asRepository(repository));

    const result = await service.listProducts({ search: '  petite   micropave ' });

    expect(repository.searchProducts).toHaveBeenCalledWith('petite micropave');
    expect(result.products).toEqual([goldRing]);
    expect(result.meta.search).toBe('petite micropave');
    expect(repository.getProducts).not.toHaveBeenCalled();
  });

  it('drops duplicate ids returned by search', async () => {
    const repository = createMockRepository({
      searchProducts: jest.fn().mockResolvedValue([backpack, backpack]),
    });
    const service = new CatalogService(asRepository(repository));

    const result = await service.listProducts({ search: 'backpack' });

    expect(result.products).toEqual([backpack]);
  });

  it('applies the limit after computing the total', async () => {
    const { service } = setup();

    const result = await service.listProducts({ limit: 2 });

    expect(result.products).toHaveLength(2);
    expect(result.meta.total).toBe(3);
  });

  it('rejects an invalid limit', async () => {
    const { service } = setup();

    await expect(service.listProducts({ limit: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: expect.objectContaining({ limit: expect.any(Array) }),
    });
  });
});

describe('CatalogService.getProductById', () => {
  it('trims the id and returns the product', async () => {
    const { repository, service } = setup();

    await expect(service.getProductById('  2  ')).resolves.toEqual(backpack);
    expect(repository.getProductById).toHaveBeenCalledWith('2');
  });

  it('throws a validation error for a blank id', async () => {
    const { repository, service } = setup();

    await expect(service.getProductById('   ')).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(repository.getProductById).not.toHaveBeenCalled();
  });

  it('throws a not-found error when the repository returns null', async () => {
    const { service } = setup({ getProductById: jest.fn().mockResolvedValue(null) });

    await expect(service.getProductById('999')).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
    });
  });
});

describe('CatalogService.getCategories', () => {
  it('returns categories sorted by display name', async () => {
    const { service } = setup();

    const categories = await service.getCategories();

    expect(categories.map((category) => category.name)).toEqual([
      'Electronics',
      'Jewelery',
      "Men's Clothing",
    ]);
  });
});

describe('CatalogService.searchProducts', () => {
  it('returns an empty list for a blank query without hitting the repository', async () => {
    const { repository, service } = setup();

    await expect(service.searchProducts('   ')).resolves.toEqual([]);
    expect(repository.searchProducts).not.toHaveBeenCalled();
  });

  it('returns only matching tokens from the adapter results', async () => {
    const { service } = setup();

    const results = await service.searchProducts('headphones');

    expect(results).toEqual([headphones]);
  });
});
