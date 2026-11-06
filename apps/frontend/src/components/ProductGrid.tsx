import type { Product } from '@catalogue/contracts';
import { ProductCard, ProductCardSkeleton } from '@/features/ProductCard';
import { cn } from '@/lib/utils';

export interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
  className?: string;
}

export function ProductGrid({ products, isLoading = false, skeletonCount = 8, className }: ProductGridProps) {
  const gridClass = cn('grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className);

  if (isLoading) {
    return (
      <ul className={gridClass} aria-busy="true" aria-label="Loading products">
        {Array.from({ length: skeletonCount }, (_, index) => (
          <li key={index}>
            <ProductCardSkeleton />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={gridClass}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
