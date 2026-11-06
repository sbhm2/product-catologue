export type DomainErrorCode =
  | 'VALIDATION_ERROR'
  | 'PRODUCT_NOT_FOUND'
  | 'UNKNOWN_CATEGORY'
  | 'UPSTREAM_UNAVAILABLE';

/**
 * Errors raised by the business layer. They carry a stable machine-readable
 * code and optional field-level details; mapping a code to an HTTP status is
 * the presentation layer's job, so the domain stays transport agnostic.
 */
export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: Record<string, string[]>;

  constructor(code: DomainErrorCode, message: string, details?: Record<string, string[]>) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'The request payload is invalid.', details?: Record<string, string[]>) {
    super('VALIDATION_ERROR', message, details);
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super('PRODUCT_NOT_FOUND', `No product was found with id "${productId}".`);
  }
}

export class UnknownCategoryError extends DomainError {
  constructor(category: string) {
    super('UNKNOWN_CATEGORY', `The category "${category}" does not exist.`);
  }
}

export class UpstreamUnavailableError extends DomainError {
  constructor(message = 'The product source is currently unavailable.') {
    super('UPSTREAM_UNAVAILABLE', message);
  }
}
