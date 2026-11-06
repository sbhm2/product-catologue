import { Search } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  /** External value, e.g. the `q` search param. */
  initialValue?: string;
  /** Runs on form submission (Enter or the Search button). */
  onSearch: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  size?: 'default' | 'large';
  className?: string;
}

export function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Search the catalogue…',
  autoFocus = false,
  ariaLabel = 'Search products',
  size = 'default',
  className,
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
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
          onChange={(event) => {
            const nextValue = event.target.value;
            setValue(nextValue);
            if (nextValue === '') {
              onSearch('');
            }
          }}
          className={cn(
            'pl-11 pr-10',
            size === 'large' && 'h-14 rounded-2xl text-base shadow-md',
          )}
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            className="absolute right-2 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full"
            onClick={handleClear}
          >
            ×
          </Button>
        )}
      </div>
      <Button type="submit" size={size === 'large' ? 'lg' : 'md'}>
        Search
      </Button>
    </form>
  );
}
