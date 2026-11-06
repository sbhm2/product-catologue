import { ChevronRight } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { EmptyState, ErrorState } from '@/components/Feedback';
import { ProductGrid } from '@/components/ProductGrid';
import { CategoryFilter } from '@/features/CategoryFilter';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { humanizeSlug } from '@/lib/format';

export function CategoryPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const categories = useCategories();
  const products = useProducts(slug ? { category: slug } : { limit: 24 });

  const activeCategory = categories.data.find((category) => category.slug === slug);
  const title = slug ? (activeCategory?.name ?? humanizeSlug(slug)) : 'All products';

  const handleCategoryChange = (nextSlug: string) => {
    navigate(nextSlug ? `/categories/${nextSlug}` : '/search');
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight aria-hidden="true" className="size-3.5" />
        <Link to="/search" className="hover:text-foreground">
          Catalogue
        </Link>
        {slug ? (
          <>
            <ChevronRight aria-hidden="true" className="size-3.5" />
            <span aria-current="page" className="text-foreground">
              {title}
            </span>
          </>
        ) : null}
      </nav>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Collection
          </p>
          <h1 className="mt-2 text-4xl sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
            {products.isLoading
              ? 'Loading…'
              : `${products.data.length} ${products.data.length === 1 ? 'piece' : 'pieces'}${
                  activeCategory ? ` in ${activeCategory.name}` : ''
                }`}
          </p>
        </div>

        <CategoryFilter
          className="w-full sm:w-80"
          categories={categories.data}
          value={slug}
          onChange={handleCategoryChange}
        />
      </div>

      <div className="mt-10">
        {products.isError ? (
          <ErrorState
            title="Products unavailable"
            message={products.error?.message ?? 'We could not load this category. Please try again.'}
            onRetry={products.refetch}
          />
        ) : !products.isLoading && products.data.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            message="This category has no products at the moment. Try another category or browse the full catalogue."
            action={
              <Link
                to="/search"
                className="mt-2 text-sm font-medium text-accent underline-offset-4 hover:underline"
              >
                Browse all products
              </Link>
            }
          />
        ) : (
          <ProductGrid products={products.data} isLoading={products.isLoading} skeletonCount={6} />
        )}
      </div>
    </div>
  );
}
