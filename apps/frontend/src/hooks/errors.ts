export function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

export function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
