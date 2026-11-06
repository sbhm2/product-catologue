import type { Category } from '@catalogue/contracts';
import { useId } from 'react';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface CategoryFilterProps {
  categories: Category[];
  value: string;
  onChange: (slug: string) => void;
  label?: string;
  className?: string;
}

export function CategoryFilter({
  categories,
  value,
  onChange,
  label = 'Filter by category',
  className,
}: CategoryFilterProps) {
  const selectId = useId();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <label
        htmlFor={selectId}
        className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </label>
      <Select id={selectId} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name} ({category.productCount})
          </option>
        ))}
      </Select>
    </div>
  );
}
