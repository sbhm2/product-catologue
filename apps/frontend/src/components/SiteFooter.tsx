import { Link } from 'react-router-dom';

export function SiteFooter() {
  return (
    <footer className="border-t border-border/70 bg-muted/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg">Northwind Supply</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            A demonstration catalogue. Products are sourced from FakeStore and normalised by the
            backend, so the client never talks to a third party directly.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <Link to="/search" className="hover:text-foreground">
            Catalogue
          </Link>
        </nav>
      </div>
    </footer>
  );
}
