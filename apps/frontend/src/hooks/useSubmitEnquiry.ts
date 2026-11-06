import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  const mutation = useMutation({
    mutationFn: (input: EnquiryInput) => submitEnquiry(input),
  });

  const { mutateAsync, reset: resetMutation } = mutation;

  const submit = useCallback(
    async (input: EnquiryInput): Promise<EnquiryReceipt> => {
      try {
        return await mutateAsync(input);
      } catch (cause) {
        throw toError(cause);
      }
    },
    [mutateAsync],
  );

  const reset = useCallback(() => {
    resetMutation();
  }, [resetMutation]);

  return {
    submit,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    receipt: mutation.data ?? null,
    error: mutation.error ? toError(mutation.error) : null,
    reset,
  };
}
