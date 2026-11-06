import {
  enquirySchema,
  ENQUIRY_LIMITS,
  type EnquiryFieldErrors,
  type EnquiryInput,
  type EnquiryReceipt,
  type Product,
} from '@catalogue/contracts';
import { CheckCircle2, Send } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toFieldErrors } from '@/lib/validation';

type FormValues = Pick<EnquiryInput, 'name' | 'email' | 'message'>;
type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY_FORM: FormValues = { name: '', email: '', message: '' };

export interface EnquiryModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Injected so the modal stays presentation-only and testable. */
  onSubmit: (input: EnquiryInput) => Promise<EnquiryReceipt>;
}

export function EnquiryModal({ product, open, onOpenChange, onSubmit }: EnquiryModalProps) {
  const idPrefix = useId();
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<EnquiryFieldErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<EnquiryReceipt | null>(null);
  const submittingRef = useRef(false);

  const nameId = `${idPrefix}-name`;
  const emailId = `${idPrefix}-email`;
  const messageId = `${idPrefix}-message`;
  const formErrorId = `${idPrefix}-form-error`;

  useEffect(() => {
    if (!open) {
      setValues(EMPTY_FORM);
      setFieldErrors({});
      setStatus('idle');
      setFormError(null);
      setReceipt(null);
      submittingRef.current = false;
    }
  }, [open]);

  const handleChange =
    (field: keyof FormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target;
      setValues((current) => ({ ...current, [field]: value }));
      setFieldErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
    };

  const focusFirstInvalidField = (errors: EnquiryFieldErrors) => {
    const order: (keyof FormValues)[] = ['name', 'email', 'message'];
    const firstInvalid = order.find((field) => errors[field]?.length);
    if (!firstInvalid) return;
    const element = document.getElementById(`${idPrefix}-${firstInvalid}`);
    element?.focus();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const parsed = enquirySchema.safeParse({ ...values, productId: product.id });
    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error) as EnquiryFieldErrors;
      setFieldErrors(errors);
      setFormError(null);
      setStatus('idle');
      focusFirstInvalidField(errors);
      return;
    }

    submittingRef.current = true;
    setStatus('submitting');
    setFormError(null);

    try {
      const result = await onSubmit(parsed.data);
      setReceipt(result);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setFormError(
        error instanceof Error
          ? error.message
          : 'Your enquiry could not be sent. Please try again.',
      );
    } finally {
      submittingRef.current = false;
    }
  };

  const isSubmitting = status === 'submitting';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
              <CheckCircle2 aria-hidden="true" className="size-6" />
            </span>
            <DialogTitle className="text-2xl">Enquiry received</DialogTitle>
            <DialogDescription className="max-w-sm">
              Thanks, {values.name.split(' ')[0] ?? 'there'}. Our team will reply to{' '}
              <span className="font-medium text-foreground">{values.email}</span> about{' '}
              <span className="font-medium text-foreground">{product.title}</span>.
            </DialogDescription>
            {receipt ? (
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Reference {receipt.id.slice(0, 8)}
              </p>
            ) : null}
            <Button className="mt-3" onClick={() => onOpenChange(false)}>
              Continue browsing
            </Button>
          </div>
        ) : (
          <>
            <div className="pr-10">
              <DialogTitle className="text-2xl">Enquire about this piece</DialogTitle>
              <DialogDescription className="mt-1">
                {product.title} · Send us a question and we will reply by email.
              </DialogDescription>
            </div>

            <form noValidate onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor={nameId} className="text-sm font-medium">
                  Your name
                </label>
                <Input
                  id={nameId}
                  name="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={handleChange('name')}
                  aria-invalid={Boolean(fieldErrors.name) || undefined}
                  aria-describedby={fieldErrors.name ? `${nameId}-error` : undefined}
                  disabled={isSubmitting}
                />
                {fieldErrors.name?.length ? (
                  <p id={`${nameId}-error`} role="alert" className="text-xs font-medium text-destructive">
                    {fieldErrors.name[0]}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={emailId} className="text-sm font-medium">
                  Email address
                </label>
                <Input
                  id={emailId}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={handleChange('email')}
                  aria-invalid={Boolean(fieldErrors.email) || undefined}
                  aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
                  disabled={isSubmitting}
                />
                {fieldErrors.email?.length ? (
                  <p id={`${emailId}-error`} role="alert" className="text-xs font-medium text-destructive">
                    {fieldErrors.email[0]}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-4">
                  <label htmlFor={messageId} className="text-sm font-medium">
                    Message
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {values.message.length}/{ENQUIRY_LIMITS.messageMax}
                  </span>
                </div>
                <Textarea
                  id={messageId}
                  name="message"
                  value={values.message}
                  onChange={handleChange('message')}
                  placeholder="Tell us what you would like to know about this product."
                  aria-invalid={Boolean(fieldErrors.message) || undefined}
                  aria-describedby={fieldErrors.message ? `${messageId}-error` : undefined}
                  disabled={isSubmitting}
                />
                {fieldErrors.message?.length ? (
                  <p id={`${messageId}-error`} role="alert" className="text-xs font-medium text-destructive">
                    {fieldErrors.message[0]}
                  </p>
                ) : null}
              </div>

              {formError ? (
                <p
                  id={formErrorId}
                  role="alert"
                  className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {formError}
                </p>
              ) : null}

              <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  {isSubmitting ? 'Sending enquiry…' : 'Send enquiry'}
                  {!isSubmitting ? <Send aria-hidden="true" className="size-4" /> : null}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
