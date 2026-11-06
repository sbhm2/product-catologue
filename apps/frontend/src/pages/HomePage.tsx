import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/Feedback';
import { ProductGrid } from '@/components/ProductGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from '@/features/SearchBar';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';

export function HomePage() {
  const navigate = useNavigate();
  const categories = useCategories();
  const featured = useProducts({ limit: 8 });

  const goToSearch = (query: string) => {
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  return (
    <div>
      <section className="border-b border-border/70 bg-[radial-gradient(130%_130%_at_0%_0%,var(--color-muted)_0%,var(--color-background)_62%)]">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
            Curated everyday objects
          </p>
          <h1 className="mt-5 max-w-2xl text-4xl leading-[1.03] sm:text-6xl">
            Things worth
            <br />
            keeping.
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            A considered catalogue of clothing, jewellery and electronics, chosen for how they feel
            to live with. Search the collection or browse by category.
          </p>

          <div className="mt-8 max-w-xl">
            <SearchBar
              size="large"
              onSearch={goToSearch}
              placeholder="Try “jacket”, “gold” or “headphones”"
              ariaLabel="Search the catalogue"
            />
          </div>

          <dl className="mt-12 flex flex-wrap gap-x-12 gap-y-6">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Categories</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {categories.isLoading ? '—' : categories.data.length}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Pieces</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {featured.isLoading ? '—' : (featured.meta?.total ?? featured.data.length)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Dispatch</dt>
              <dd className="mt-1 text-2xl font-semibold">48h</dd>
            </div>
          </dl>
        </div>
      </section>

      <section aria-labelledby="home-categories" className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Browse
            </p>
            <h2 id="home-categories" className="mt-2 text-3xl">
              Shop by category
            </h2>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-accent"
          >
            View the full catalogue
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        {categories.isError ? (
          <ErrorState
            className="mt-8"
            title="Categories unavailable"
            message={categories.error?.message ?? 'We could not load the categories. Please try again.'}
            onRetry={categories.refetch}
          />
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.isLoading
              ? Array.from({ length: 4 }, (_, index) => (
                  <li key={index}>
                    <Skeleton className="h-44 rounded-3xl" />
                  </li>
                ))
              : categories.data.map((category, index) => (
                  <li key={category.slug}>
                    <Link
                      to={`/categories/${category.slug}`}
                      className="group flex h-full flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 transition-colors hover:border-accent/50"
                    >
                      <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="mt-12 block font-display text-2xl leading-tight">
                        {category.name}
                      </span>
                      <span className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        {category.productCount} products
                        <ArrowRight
                          aria-hidden="true"
                          className="size-4 transition-transform group-hover:translate-x-1"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="featured" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Selected
            </p>
            <h2 id="featured" className="mt-2 text-3xl">
              Featured pieces
            </h2>
          </div>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-accent"
          >
            See all products
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>

        <div className="mt-8">
          {featured.isError ? (
            <ErrorState
              title="Products unavailable"
              message={featured.error?.message ?? 'We could not load the products. Please try again.'}
              onRetry={featured.refetch}
            />
          ) : (
            <ProductGrid products={featured.data} isLoading={featured.isLoading} />
          )}
        </div>
      </section>
    </div>
  );
}
