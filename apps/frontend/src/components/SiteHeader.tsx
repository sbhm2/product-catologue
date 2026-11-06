import { Search } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }): string =>
  cn(
    'rounded-full px-3 py-2 text-sm transition-colors',
    isActive ? 'bg-secondary font-medium text-secondary-foreground' : 'text-muted-foreground hover:text-foreground',
  );

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <Link to="/" className="group flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-foreground">Northwind</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-accent transition-colors group-hover:text-accent/80">
            Supply
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <nav aria-label="Main" className="flex items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/search" className={navLinkClass}>
              Catalogue
            </NavLink>
          </nav>
          <Link
            to="/search"
            aria-label="Search the catalogue"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
