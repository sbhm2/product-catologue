import { useCallback, useEffect, useRef, useState } from 'react';
import type { EnquiryInput, EnquiryReceipt } from '@catalogue/contracts';
import { submitEnquiry } from '@/api/enquiries';
import { toError } from './errors';

export interface UseSubmitEnquiryResult {
  submit: (input: EnquiryInput) => Promise<EnquiryReceipt>;
  isSubmitting: boolean;
  isSuccess: boolean;
  receipt: EnquiryReceipt | null;
  error: Error | null;
  reset: () => void;
}

export function useSubmitEnquiry(): UseSubmitEnquiryResult {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [receipt, setReceipt] = useState<EnquiryReceipt | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = useCallback(async (input: EnquiryInput): Promise<EnquiryReceipt> => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      const nextReceipt = await submitEnquiry(input);
      if (mounted.current) {
        setReceipt(nextReceipt);
        setIsSuccess(true);
      }
      return nextReceipt;
    } catch (cause) {
      const normalized = toError(cause);
      if (mounted.current) {
        setError(normalized);
      }
      throw normalized;
    } finally {
      if (mounted.current) {
        setIsSubmitting(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setIsSuccess(false);
    setReceipt(null);
    setError(null);
  }, []);

  return { submit, isSubmitting, isSuccess, receipt, error, reset };
}
