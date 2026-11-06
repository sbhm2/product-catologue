import type { ApiErrorBody } from '@catalogue/contracts';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { DomainError, type DomainErrorCode } from '../../business/errors';
import type { ILogger } from '../../business/ports/ILogger';

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  VALIDATION_ERROR: 400,
  PRODUCT_NOT_FOUND: 404,
  UNKNOWN_CATEGORY: 404,
  UPSTREAM_UNAVAILABLE: 502,
};

export const notFoundHandler: RequestHandler = (_req, res) => {
  const body: ApiErrorBody = {
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'The requested endpoint does not exist.',
    },
  };
  res.status(404).json(body);
};

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function createErrorHandler(logger: ILogger): ErrorRequestHandler {
  return (error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof DomainError) {
      const body: ApiErrorBody = {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      };
      res.status(STATUS_BY_CODE[error.code] ?? 500).json(body);
      return;
    }

    // express.json() rejects invalid JSON with a SyntaxError carrying `body`.
    if (error instanceof SyntaxError && 'body' in error) {
      const body: ApiErrorBody = {
        error: {
          code: 'INVALID_JSON',
          message: 'The request body is not valid JSON.',
        },
      };
      res.status(400).json(body);
      return;
    }

    logger.error('http.unhandled_error', {
      method: req.method,
      path: req.originalUrl,
      reason: describeError(error),
    });

    const body: ApiErrorBody = {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
      },
    };
    res.status(500).json(body);
  };
}
