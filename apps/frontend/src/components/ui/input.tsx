import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export const inputStyles =
  'flex h-11 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/15';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = 'text', ...props }: InputProps) {
  return <input type={type} className={cn(inputStyles, className)} {...props} />;
}
