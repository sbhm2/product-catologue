import type { Product } from '@catalogue/contracts';
import { ArrowLeft, ArrowRight, ChevronRight, Star } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorState } from '@/components/Feedback';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EnquiryModal } from '@/features/EnquiryModal';
import { useProductDetail } from '@/hooks/useProductDetail';
import { useSubmitEnquiry } from '@/hooks/useSubmitEnquiry';
import { formatPrice, formatRating, stockLabel } from '@/lib/format';
import { cn } from '@/lib/utils';

const STOCK_VARIANTS: Record<Product['stock']['status'], BadgeVariant> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'destructive',
};

function RatingStars({ rate }: { rate: number }) {
  const filled = Math.round(rate);

  return (
    <span
      role="img"
      aria-label={`Rated ${formatRating(rate)} out of 5`}
      className="inline-flex items-center gap-0.5"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn('size-4', index < filled ? 'fill-accent text-accent' : 'text-border')}
        />
      ))}
    </span>
  );
}

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError, notFound, error, refetch } = useProductDetail(id);
  const { submit } = useSubmitEnquiry();
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10" aria-busy="true">
        <Skeleton className="h-4 w-64" />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-56 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        {notFound ? (
          <EmptyState
            title="Product not found"
            message="This product may have been removed from the catalogue."
            action={
              <Link to="/search" className="mt-2 text-sm font-medium text-accent hover:underline">
                Browse the catalogue
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="Product unavailable"
            message={error?.message ?? 'We could not load this product. Please try again.'}
            onRetry={refetch}
          />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link to={`/categories/${product.category}`} className="hover:text-foreground">
          {product.categoryLabel}
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <span aria-current="page" className="max-w-[24ch] truncate text-foreground sm:max-w-xs">
          {product.title}
        </span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-muted/50 p-8 sm:p-14">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="max-h-[420px] w-full object-contain mix-blend-multiply"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{product.categoryLabel}</Badge>
            <Badge variant={STOCK_VARIANTS[product.stock.status]}>{stockLabel(product.stock.status)}</Badge>
          </div>

          <h1 className="mt-5 text-4xl leading-tight sm:text-5xl">{product.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <RatingStars rate={product.rating.rate} />
            <span className="font-medium text-foreground">{formatRating(product.rating.rate)}</span>
            <span aria-hidden="true">·</span>
            <span>{product.rating.count} reviews</span>
          </div>

          <p className="mt-6 text-3xl font-semibold tracking-tight">
            {formatPrice(product.price, product.currency)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Taxes and shipping calculated at enquiry.</p>

          <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={() => setEnquiryOpen(true)}>
              Enquire about this product
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft aria-hidden="true" className="size-4" />
              Back
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No payment required. Send us a question and our team replies by email.
          </p>

          <dl className="mt-10 divide-y divide-border/70 border-t border-border/70 text-sm">
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-muted-foreground">Category</dt>
              <dd>
                <Link to={`/categories/${product.category}`} className="font-medium hover:text-accent">
                  {product.categoryLabel}
                </Link>
              </dd>
            </div>
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-muted-foreground">Reference</dt>
              <dd className="font-medium">NW-{product.id.padStart(4, '0')}</dd>
            </div>
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-muted-foreground">Availability</dt>
              <dd className="font-medium">{stockLabel(product.stock.status)}</dd>
            </div>
            <div className="flex justify-between gap-6 py-3">
              <dt className="text-muted-foreground">Rating</dt>
              <dd className="font-medium">
                {formatRating(product.rating.rate)} / 5 · {product.rating.count} reviews
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <EnquiryModal
        product={product}
        open={enquiryOpen}
        onOpenChange={setEnquiryOpen}
        onSubmit={submit}
      />
    </div>
  );
}
