import { useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState } from '@/components/Feedback';
import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/features/SearchBar';
import { useProducts } from '@/hooks/useProducts';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const products = useProducts(query ? { search: query } : { limit: 24 });

  const applyQuery = (nextQuery: string, replace = false) => {
    setSearchParams(nextQuery ? { q: nextQuery } : {}, { replace });
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-14">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Catalogue
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">
          {query ? `Results for “${query}”` : 'Browse the catalogue'}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground" aria-live="polite">
          {products.isLoading
            ? 'Searching the catalogue…'
            : `${products.data.length} ${products.data.length === 1 ? 'product' : 'products'} found`}
        </p>

        <div className="mt-6">
          <SearchBar
            initialValue={query}
            onSearch={(nextQuery) => applyQuery(nextQuery)}
            onDebouncedChange={(nextQuery) => applyQuery(nextQuery, true)}
            autoFocus
            ariaLabel="Search products"
          />
        </div>
      </div>

      <div className="mt-10">
        {products.isError ? (
          <ErrorState
            title="Search unavailable"
            message={products.error?.message ?? 'We could not run that search. Please try again.'}
            onRetry={products.refetch}
          />
        ) : !products.isLoading && products.data.length === 0 ? (
          <EmptyState
            title={query ? 'No products matched your search' : 'The catalogue is empty'}
            message={
              query
                ? 'Try a broader term, or browse the catalogue by category from the home page.'
                : 'Products will appear here once the catalogue source is available.'
            }
            action={
              query ? (
                <Button variant="outline" className="mt-2" onClick={() => applyQuery('')}>
                  Clear search
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ProductGrid products={products.data} isLoading={products.isLoading} />
        )}
      </div>
    </div>
  );
}
