import { enquiryEnvelopeSchema, type EnquiryInput, type EnquiryReceipt } from '@catalogue/contracts';
import { request } from './client';

export async function submitEnquiry(input: EnquiryInput): Promise<EnquiryReceipt> {
  const { data } = await request('/api/enquiries', {
    method: 'POST',
    body: JSON.stringify(input),
    schema: enquiryEnvelopeSchema,
  });
  return data;
}
