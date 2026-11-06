export function formatPrice(price: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatRating(rate: number): string {
  return rate.toFixed(1);
}

export function humanizeSlug(slug: string): string {
  const words = slug.split('-').filter(Boolean);
  if (words.length === 0) return 'All products';
  return words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(' ');
}

export function stockLabel(status: 'in_stock' | 'low_stock' | 'out_of_stock'): string {
  switch (status) {
    case 'in_stock':
      return 'In stock';
    case 'low_stock':
      return 'Low stock';
    case 'out_of_stock':
      return 'Out of stock';
  }
}
