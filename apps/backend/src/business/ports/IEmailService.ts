import type { Product } from '@catalogue/contracts';

export interface EnquiryNotification {
  enquiryId: string;
  product: Product;
  customer: {
    name: string;
    email: string;
    message: string;
  };
  receivedAt: string;
}

/**
 * Port for outbound notifications.
 *
 * The console adapter satisfies it locally; a Resend/SendGrid adapter only
 * needs to implement this method.
 */
export interface IEmailService {
  sendEnquiryNotification(payload: EnquiryNotification): Promise<void>;
}
