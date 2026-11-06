import type { Category } from '@catalogue/contracts';
import type { EnquiryNotification, IEmailService } from '../src/business/ports/IEmailService';
import type { ILogger, LogContext } from '../src/business/ports/ILogger';
import type { IProductRepository } from '../src/business/ports/IProductRepository';
import { products } from './fixtures/products';

export interface MockProductRepository {
  getProducts: jest.Mock;
  getProductById: jest.Mock;
  getCategories: jest.Mock;
  searchProducts: jest.Mock;
}

export function createMockRepository(
  overrides: Partial<MockProductRepository> = {},
): MockProductRepository {
  const categories: Category[] = [
    { slug: 'mens-clothing', name: "Men's Clothing", productCount: 1 },
    { slug: 'jewelery', name: 'Jewelery', productCount: 1 },
    { slug: 'electronics', name: 'Electronics', productCount: 1 },
  ];

  return {
    getProducts: jest.fn().mockResolvedValue(products),
    getProductById: jest.fn().mockResolvedValue(products[0]),
    getCategories: jest.fn().mockResolvedValue(categories),
    searchProducts: jest.fn().mockResolvedValue(products),
    ...overrides,
  };
}

export function asRepository(mock: MockProductRepository): IProductRepository {
  return mock as unknown as IProductRepository;
}

export interface RecordingEmailService extends IEmailService {
  sendEnquiryNotification: jest.Mock<Promise<void>, [EnquiryNotification]>;
  notifications: EnquiryNotification[];
}

export function createRecordingEmailService(): RecordingEmailService {
  const notifications: EnquiryNotification[] = [];
  const sendEnquiryNotification = jest.fn(async (payload: EnquiryNotification) => {
    notifications.push(payload);
  });

  return { sendEnquiryNotification, notifications };
}

export interface RecordingLogger extends ILogger {
  info: jest.Mock<void, [string, LogContext?]>;
  warn: jest.Mock<void, [string, LogContext?]>;
  error: jest.Mock<void, [string, LogContext?]>;
}

export function createRecordingLogger(): RecordingLogger {
  return {
    info: jest.fn<void, [string, LogContext?]>(),
    warn: jest.fn<void, [string, LogContext?]>(),
    error: jest.fn<void, [string, LogContext?]>(),
  };
}
