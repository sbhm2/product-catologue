import type { ZodError } from 'zod';

export function toFieldErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join('.') : '_form';
    (errors[key] ??= []).push(issue.message);
  }

  return errors;
}
