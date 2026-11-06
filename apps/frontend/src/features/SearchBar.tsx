import { Search } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  /** External value, e.g. the `q` search param. */
  initialValue?: string;
  /** Runs on form submission (Enter or the Search button). */
  onSearch: (query: string) => void;
  /** Runs after the user stops typing. Enables instant search. */
  onDebouncedChange?: (query: string) => void;
  debounceMs?: number;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  size?: 'default' | 'large';
  className?: string;
}

export function SearchBar({
  initialValue = '',
  onSearch,
  onDebouncedChange,
  debounceMs = 350,
  placeholder = 'Search the catalogue…',
  autoFocus = false,
  ariaLabel = 'Search products',
  size = 'default',
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const debouncedChange = useRef(onDebouncedChange);

  useEffect(() => {
    debouncedChange.current = onDebouncedChange;
  }, [onDebouncedChange]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const callback = debouncedChange.current;
    if (!callback || value.trim() === initialValue.trim()) return;

    const timer = setTimeout(() => callback(value.trim()), debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, initialValue]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form role="search" onSubmit={handleSubmit} className={cn('flex w-full items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label={ariaLabel}
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          className={cn(
            'pl-11',
            size === 'large' && 'h-14 rounded-2xl text-base shadow-md',
          )}
        />
      </div>
      <Button type="submit" size={size === 'large' ? 'lg' : 'md'}>
        Search
      </Button>
    </form>
  );
}
