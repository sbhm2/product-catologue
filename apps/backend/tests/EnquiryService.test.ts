import { EnquiryService } from '../src/business/services/EnquiryService';
import { backpack } from './fixtures/products';
import {
  asRepository,
  createMockRepository,
  createRecordingEmailService,
  type MockProductRepository,
} from './helpers';

const RECEIVED_AT = new Date('2026-02-03T10:15:00.000Z');

function setup(repositoryOverrides: Partial<MockProductRepository> = {}) {
  const repository = createMockRepository(repositoryOverrides);
  const emailService = createRecordingEmailService();
  const service = new EnquiryService({
    repository: asRepository(repository),
    emailService,
    clock: () => RECEIVED_AT,
    generateId: () => 'enquiry-123',
  });

  return { repository, emailService, service };
}

const validPayload = {
  productId: '1',
  name: '  Ada Lovelace  ',
  email: 'ada@example.com',
  message: '  Is the backpack available in olive green?  ',
};

describe('EnquiryService', () => {
  it('validates, persists the notification and returns a receipt', async () => {
    const { repository, emailService, service } = setup();

    const receipt = await service.submit(validPayload);

    expect(receipt).toEqual({
      id: 'enquiry-123',
      productId: '1',
      receivedAt: '2026-02-03T10:15:00.000Z',
    });
    expect(repository.getProductById).toHaveBeenCalledWith('1');
    expect(emailService.sendEnquiryNotification).toHaveBeenCalledTimes(1);
    expect(emailService.notifications[0]).toMatchObject({
      enquiryId: 'enquiry-123',
      product: backpack,
      receivedAt: RECEIVED_AT.toISOString(),
      customer: {
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        message: 'Is the backpack available in olive green?',
      },
    });
  });

  it('uses the same shared schema as the client for validation', async () => {
    const { repository, emailService, service } = setup();

    await expect(
      service.submit({ productId: '1', name: 'A', email: 'not-an-email', message: 'too short' }),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: expect.objectContaining({
        name: expect.any(Array),
        email: expect.any(Array),
        message: expect.any(Array),
      }),
    });

    expect(repository.getProductById).not.toHaveBeenCalled();
    expect(emailService.sendEnquiryNotification).not.toHaveBeenCalled();
  });

  it('rejects an enquiry for a product that does not exist', async () => {
    const { emailService, service } = setup({
      getProductById: jest.fn().mockResolvedValue(null),
    });

    await expect(service.submit(validPayload)).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
    });
    expect(emailService.sendEnquiryNotification).not.toHaveBeenCalled();
  });

  it('propagates email provider failures instead of returning a receipt', async () => {
    const emailService = createRecordingEmailService();
    emailService.sendEnquiryNotification.mockRejectedValueOnce(new Error('provider down'));

    const service = new EnquiryService({
      repository: asRepository(createMockRepository()),
      emailService,
      clock: () => RECEIVED_AT,
      generateId: () => 'enquiry-456',
    });

    await expect(service.submit(validPayload)).rejects.toThrow('provider down');
  });
});
