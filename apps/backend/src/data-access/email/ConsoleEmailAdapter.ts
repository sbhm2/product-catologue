import type { EnquiryNotification, IEmailService } from '../../business/ports/IEmailService';
import type { ILogger } from '../../business/ports/ILogger';
import { createConsoleLogger } from '../logging/ConsoleLogger';

export interface ConsoleEmailAdapterOptions {
  logger?: ILogger;
}

/**
 * Local-development implementation of `IEmailService`.
 *
 * It logs the enquiry as structured JSON instead of sending mail. Replacing it
 * with Resend/SendGrid means adding an adapter and changing one line in
 * `server.ts`.
 */
export class ConsoleEmailAdapter implements IEmailService {
  private readonly logger: ILogger;

  constructor(options: ConsoleEmailAdapterOptions = {}) {
    this.logger = options.logger ?? createConsoleLogger('email');
  }

  async sendEnquiryNotification(payload: EnquiryNotification): Promise<void> {
    this.logger.info('email.enquiry_notification', {
      to: payload.customer.email,
      subject: `New enquiry: ${payload.product.title}`,
      enquiryId: payload.enquiryId,
      productId: payload.product.id,
      productTitle: payload.product.title,
      customerName: payload.customer.name,
      customerEmail: payload.customer.email,
      message: payload.customer.message,
      receivedAt: payload.receivedAt,
    });
  }
}
