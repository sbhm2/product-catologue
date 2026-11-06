import { z } from 'zod';
import { categorySchema, productListMetaSchema, productSchema } from './product.schema';
import { enquiryReceiptSchema } from './enquiry.schema';

/**
 * Standard response envelopes used by every endpoint, so clients always know
 * where to read payloads, pagination metadata and validation details.
 */
export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.record(z.string(), z.array(z.string())).optional(),
  }),
});
export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export const healthEnvelopeSchema = z.object({
  data: z.object({
    status: z.literal('ok'),
    uptimeSeconds: z.number().nonnegative(),
  }),
});
export type HealthEnvelope = z.infer<typeof healthEnvelopeSchema>;

export const productEnvelopeSchema = z.object({ data: productSchema });
export type ProductEnvelope = z.infer<typeof productEnvelopeSchema>;

export const productListEnvelopeSchema = z.object({
  data: z.array(productSchema),
  meta: productListMetaSchema,
});
export type ProductListEnvelope = z.infer<typeof productListEnvelopeSchema>;

export const categoryListEnvelopeSchema = z.object({ data: z.array(categorySchema) });
export type CategoryListEnvelope = z.infer<typeof categoryListEnvelopeSchema>;

export const enquiryEnvelopeSchema = z.object({ data: enquiryReceiptSchema });
export type EnquiryEnvelope = z.infer<typeof enquiryEnvelopeSchema>;
