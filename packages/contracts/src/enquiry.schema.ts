import { z } from 'zod';

export const ENQUIRY_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  messageMin: 10,
  messageMax: 1000,
} as const;

/**
 * Single source of truth for enquiry validation: the same schema powers the
 * client-side form and the `POST /api/enquiries` request body validation.
 */
export const enquirySchema = z.object({
  productId: z.string().trim().min(1, 'Product is required'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(ENQUIRY_LIMITS.nameMin, `Name must be at least ${ENQUIRY_LIMITS.nameMin} characters`)
    .max(ENQUIRY_LIMITS.nameMax, `Name must be at most ${ENQUIRY_LIMITS.nameMax} characters`),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .pipe(z.email('Enter a valid email address')),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required')
    .min(ENQUIRY_LIMITS.messageMin, `Message must be at least ${ENQUIRY_LIMITS.messageMin} characters`)
    .max(ENQUIRY_LIMITS.messageMax, `Message must be at most ${ENQUIRY_LIMITS.messageMax} characters`),
});
export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquiryField = keyof EnquiryInput;
export type EnquiryFieldErrors = Partial<Record<EnquiryField, string[]>>;

export const enquiryReceiptSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  receivedAt: z.iso.datetime(),
});
export type EnquiryReceipt = z.infer<typeof enquiryReceiptSchema>;
