import type { Product } from '@catalogue/contracts';

export function normalizeSearchTerm(value: string | undefined | null): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

/**
 * Splits a query into lowercase word tokens so that "men clothing" matches
 * "Men's Clothing" and punctuation never breaks a search.
 */
export function tokenize(value: string): string[] {
  return normalizeSearchTerm(value)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0);
}

export function productSearchHaystack(product: Product): string {
  return [product.title, product.description, product.category, product.categoryLabel]
    .join(' ')
    .toLowerCase();
}

export function matchesSearchTokens(product: Product, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const haystack = productSearchHaystack(product);
  return tokens.every((token) => haystack.includes(token));
}

export function filterBySearch(products: Product[], query: string): Product[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return products;
  return products.filter((product) => matchesSearchTokens(product, tokens));
}
