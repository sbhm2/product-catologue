import { enquirySchema, type EnquiryReceipt } from '@catalogue/contracts';
import { ProductNotFoundError, ValidationError } from '../errors';
import type { IEmailService } from '../ports/IEmailService';
import type { IProductRepository } from '../ports/IProductRepository';
import { toFieldErrors } from '../validation';

export interface EnquiryServiceDependencies {
  repository: IProductRepository;
  emailService: IEmailService;
  /** Injected for deterministic tests. */
  clock?: () => Date;
  /** Injected for deterministic tests. */
  generateId?: () => string;
}

export class EnquiryService {
  private readonly repository: IProductRepository;
  private readonly emailService: IEmailService;
  private readonly clock: () => Date;
  private readonly generateId: () => string;

  constructor(dependencies: EnquiryServiceDependencies) {
    this.repository = dependencies.repository;
    this.emailService = dependencies.emailService;
    this.clock = dependencies.clock ?? (() => new Date());
    this.generateId = dependencies.generateId ?? (() => globalThis.crypto.randomUUID());
  }

  async submit(payload: unknown): Promise<EnquiryReceipt> {
    const parsed = enquirySchema.safeParse(payload);
    if (!parsed.success) {
      throw new ValidationError('The enquiry is invalid.', toFieldErrors(parsed.error));
    }

    const enquiry = parsed.data;
    const product = await this.repository.getProductById(enquiry.productId);
    if (!product) {
      throw new ProductNotFoundError(enquiry.productId);
    }

    const receivedAt = this.clock().toISOString();
    const receipt: EnquiryReceipt = {
      id: this.generateId(),
      productId: product.id,
      receivedAt,
    };

    await this.emailService.sendEnquiryNotification({
      enquiryId: receipt.id,
      product,
      customer: {
        name: enquiry.name,
        email: enquiry.email,
        message: enquiry.message,
      },
      receivedAt,
    });

    return receipt;
  }
}
