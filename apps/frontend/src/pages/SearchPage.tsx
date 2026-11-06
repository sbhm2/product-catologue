import { useSearchParams } from 'react-router-dom';
import { EmptyState, ErrorState } from '@/components/Feedback';
import { ProductGrid } from '@/components/ProductGrid';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/features/SearchBar';
import { useProducts } from '@/hooks/useProducts';
import { searchProductsByTitle } from '@/api/search';
import { toError } from '@/hooks/errors';
import { type Product } from '@catalogue/contracts';
import { useEffect, useRef, useState } from 'react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = (searchParams.get('q') ?? '').trim();
  const products = useProducts(query ? { search: query } : { limit: 24 });

  const applyQuery = (nextQuery: string, replace = false) => {
    setSearchParams(nextQuery ? { q: nextQuery } : {}, { replace });
  };

  const [titleMatches, setTitleMatches] = useState<Product[]>([]);
  const [relatedItems, setRelatedItems] = useState<Product[]>([]);
  const [searchError, setSearchError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!query) {
      setTitleMatches([]);
      setRelatedItems([]);
      setSearchError(null);
      return;
    }

    let ignored = false;

    const runSearch = async () => {
      try {
        const products = await searchProductsByTitle(query, 24);
        if (ignored || !mountedRef.current) return;

        const queryLower = query.toLowerCase();
        const exact: Product[] = [];
        const related: Product[] = [];

        for (const product of products) {
          if (product.title.toLowerCase().includes(queryLower)) {
            exact.push(product);
          } else {
            related.push(product);
          }
        }

        if (mountedRef.current) {
          setTitleMatches(exact);
          setRelatedItems(related);
          setSearchError(null);
        }
      } catch (error) {
        if (ignored || !mountedRef.current) return;
        setSearchError(toError(error));
      }
    };

    runSearch();

    return () => {
      ignored = true;
    };
  }, [query]);

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
          {query && (products.isLoading || titleMatches.length === 0 && !searchError)
            ? 'Searching the catalogue…'
            : `${products.data.length} ${products.data.length === 1 ? 'product' : 'products'} found`}
        </p>

        <div className="mt-6">
          <SearchBar
            initialValue={query}
            onSearch={(nextQuery) => applyQuery(nextQuery)}
            autoFocus
            ariaLabel="Search products"
          />
        </div>
      </div>

      <div className="mt-10 space-y-10">
        {!query ? (
          <section aria-labelledby="catalogue-heading" className="space-y-4">
            <h2 id="catalogue-heading" className="sr-only">
              Catalogue
            </h2>
            <ProductGrid products={products.data} isLoading={products.isLoading} />
          </section>
        ) : searchError ? (
          <ErrorState
            title="Search unavailable"
            message={searchError.message ?? 'We could not run that search. Please try again.'}
          />
        ) : titleMatches.length === 0 && relatedItems.length === 0 && !products.isLoading ? (
          <EmptyState
            title="No products matched your search"
            message="Try a broader term, or browse the catalogue by category from the home page."
            action={
              <Button variant="outline" className="mt-2" onClick={() => applyQuery('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <>
            <section aria-labelledby="matched-heading" className="space-y-4">
              <h2 id="matched-heading" className="text-2xl font-semibold tracking-tight">
                Title matches
              </h2>
              <ProductGrid products={titleMatches} isLoading={false} />
            </section>
            <section aria-labelledby="related-heading" className="space-y-4">
              <h2 id="related-heading" className="text-2xl font-semibold tracking-tight">
                Related items
              </h2>
              <ProductGrid products={relatedItems} isLoading={false} />
            </section>
          </>
        )}
      </div>
    </div>
  );
}
