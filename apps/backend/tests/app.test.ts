import request from 'supertest';
import { UpstreamUnavailableError } from '../src/business/errors';
import { CatalogService } from '../src/business/services/CatalogService';
import { EnquiryService } from '../src/business/services/EnquiryService';
import { createApp } from '../src/presentation/app';
import { backpack, goldRing, headphones } from './fixtures/products';
import {
  asRepository,
  createMockRepository,
  createRecordingEmailService,
  createRecordingLogger,
  type MockProductRepository,
} from './helpers';

function createTestApp(repositoryOverrides: Partial<MockProductRepository> = {}) {
  const repository = createMockRepository(repositoryOverrides);
  const emailService = createRecordingEmailService();
  const logger = createRecordingLogger();

  const app = createApp({
    catalogService: new CatalogService(asRepository(repository)),
    enquiryService: new EnquiryService({
      repository: asRepository(repository),
      emailService,
      clock: () => new Date('2026-02-03T10:15:00.000Z'),
      generateId: () => 'enquiry-123',
    }),
    logger,
  });

  return { app, repository, emailService, logger };
}

describe('GET /api/health', () => {
  it('reports liveness', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ data: { status: 'ok' } });
    expect(typeof response.body.data.uptimeSeconds).toBe('number');
  });
});

describe('GET /api/products', () => {
  it('returns products inside the standard envelope', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [backpack, goldRing, headphones],
      meta: { total: 3, category: null, search: null },
    });
  });

  it('forwards category, search and limit filters', async () => {
    const { app, repository } = createTestApp();

    const response = await request(app).get('/api/products').query({ category: 'Jewelery', limit: '1' });

    expect(response.status).toBe(200);
    expect(repository.getProducts).toHaveBeenCalledWith({ category: 'jewelery' });
    expect(response.body.meta).toEqual({ total: 1, category: 'jewelery', search: null });
    expect(response.body.data).toHaveLength(1);
  });

  it('returns 404 for an unknown category', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/products').query({ category: 'garden' });

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'UNKNOWN_CATEGORY' });
  });

  it('returns 400 for an invalid limit', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/products').query({ limit: '0' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { limit: expect.any(Array) },
    });
  });

  it('maps upstream failures to 502', async () => {
    const { app } = createTestApp({
      getProducts: jest.fn().mockRejectedValue(new UpstreamUnavailableError()),
    });

    const response = await request(app).get('/api/products');

    expect(response.status).toBe(502);
    expect(response.body.error).toMatchObject({ code: 'UPSTREAM_UNAVAILABLE' });
  });
});

describe('GET /api/products/:id', () => {
  it('returns a single product', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/products/1');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: backpack });
  });

  it('returns 404 for a missing product', async () => {
    const { app } = createTestApp({
      getProductById: jest.fn().mockResolvedValue(null),
    });

    const response = await request(app).get('/api/products/999');

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
  });
});

describe('GET /api/categories', () => {
  it('returns the category list', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/categories');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { slug: 'electronics', name: 'Electronics', productCount: 1 },
      { slug: 'jewelery', name: 'Jewelery', productCount: 1 },
      { slug: 'mens-clothing', name: "Men's Clothing", productCount: 1 },
    ]);
  });
});

describe('POST /api/enquiries', () => {
  const payload = {
    productId: '1',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    message: 'Is the backpack available in olive green?',
  };

  it('creates an enquiry and notifies the email adapter', async () => {
    const { app, emailService } = createTestApp();

    const response = await request(app).post('/api/enquiries').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: {
        id: 'enquiry-123',
        productId: '1',
        receivedAt: '2026-02-03T10:15:00.000Z',
      },
    });
    expect(emailService.notifications).toHaveLength(1);
  });

  it('returns 400 with field details for invalid input', async () => {
    const { app, emailService } = createTestApp();

    const response = await request(app)
      .post('/api/enquiries')
      .send({ productId: '1', name: 'A', email: 'not-an-email', message: 'short' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(response.body.error.details)).toEqual(
      expect.arrayContaining(['name', 'email', 'message']),
    );
    expect(emailService.notifications).toHaveLength(0);
  });

  it('returns 400 INVALID_JSON for a malformed body', async () => {
    const { app } = createTestApp();

    const response = await request(app)
      .post('/api/enquiries')
      .set('Content-Type', 'application/json')
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });
});

describe('unknown routes', () => {
  it('returns the 404 ROUTE_NOT_FOUND envelope', async () => {
    const { app } = createTestApp();

    const response = await request(app).get('/api/nope');

    expect(response.status).toBe(404);
    expect(response.body.error).toMatchObject({ code: 'ROUTE_NOT_FOUND' });
  });
});
