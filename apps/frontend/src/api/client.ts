import { apiErrorSchema } from '@catalogue/contracts';
import type { z } from 'zod';
import { env } from '@/config/env';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    status: number,
    code: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface RequestOptions<T> extends RequestInit {
  schema: z.ZodType<T>;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Every call validates the response envelope with the shared Zod schema, so a
 * contract drift surfaces as a typed error instead of `undefined` in the UI.
 */
export async function request<T>(path: string, { schema, headers, ...init }: RequestOptions<T>): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        accept: 'application/json',
        ...(init.body ? { 'content-type': 'application/json' } : {}),
        ...headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(
      'Unable to reach the catalogue service. Please check that the API is running.',
      0,
      'NETWORK_ERROR',
    );
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(payload);
    if (parsed.success) {
      throw new ApiError(
        parsed.data.error.message,
        response.status,
        parsed.data.error.code,
        parsed.data.error.details,
      );
    }
    throw new ApiError(`The request failed with status ${response.status}.`, response.status, 'UNKNOWN_ERROR');
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiError(
      'The catalogue service returned an unexpected response.',
      response.status,
      'INVALID_RESPONSE',
    );
  }

  return parsed.data;
}
