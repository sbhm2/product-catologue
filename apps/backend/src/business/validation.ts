import type { ZodError } from 'zod';

/**
 * Converts a Zod error into the `details` shape exposed by the API:
 * `{ fieldName: ["message", ...] }`. Form-level issues use the `_form` key.
 */
export function toFieldErrors(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join('.') : '_form';
    (details[key] ??= []).push(issue.message);
  }

  return details;
}
