import type { Product, StockStatus } from '@catalogue/contracts';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { formatPrice, formatRating, stockLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

const STOCK_VARIANTS: Record<StockStatus, BadgeVariant> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'destructive',
};

export interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-shadow duration-300 hover:shadow-lg',
        className,
      )}
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-muted/60 p-8">
        <Link
          to={`/products/${product.id}`}
          aria-label={`View ${product.title}`}
          className="flex h-full w-full items-center justify-center rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <img
            src={product.imageUrl}
            alt=""
            loading="lazy"
            className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-4 top-4">
          <Badge variant={STOCK_VARIANTS[product.stock.status]}>{stockLabel(product.stock.status)}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{product.categoryLabel}</p>

        <h3 className="font-sans text-base font-medium leading-snug">
          <Link
            to={`/products/${product.id}`}
            className="rounded-sm transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {product.title}
          </Link>
        </h3>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Star aria-hidden="true" className="size-3.5 fill-accent text-accent" />
          <span>{formatRating(product.rating.rate)}</span>
          <span aria-hidden="true">·</span>
          <span>
            {product.rating.count} {product.rating.count === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        <p className="mt-auto pt-2 text-lg font-semibold tracking-tight">
          {formatPrice(product.price, product.currency)}
        </p>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="flex flex-col gap-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-muted" />
        <div className="h-4 w-1/3 animate-pulse rounded-full bg-muted" />
      </div>
    </div>
  );
}
